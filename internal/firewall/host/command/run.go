package command

import (
	"bytes"
	"context"
	"errors"
	"os/exec"
	"time"
)

const Timeout = 5 * time.Second
const MaxOutput = 256 << 10

type output struct{ buffer bytes.Buffer }

func (value *output) Write(data []byte) (int, error) {
	if value.buffer.Len()+len(data) > MaxOutput {
		return 0, errors.New("firewall output exceeds limit")
	}
	return value.buffer.Write(data)
}
func Run(ctx context.Context, program string, args ...string) (string, error) {
	if program != "/usr/sbin/ufw" && program != "/usr/bin/docker" {
		return "", errors.New("unsupported firewall program")
	}
	ctx, cancel := context.WithTimeout(ctx, Timeout)
	defer cancel()
	process := exec.CommandContext(ctx, program, args...)
	process.Env = []string{"PATH=/usr/sbin:/usr/bin:/sbin:/bin", "LC_ALL=C", "LANG=C", "HOME=/nonexistent", "DOCKER_CONFIG=/nonexistent", "DOCKER_HOST=unix:///var/run/docker.sock"}
	process.WaitDelay = time.Second
	configure(process)
	stdout := &output{}
	stderr := &output{}
	process.Stdout, process.Stderr = stdout, stderr
	if err := process.Run(); err != nil {
		return "", errors.New("Команда firewall не выполнена. Проверьте журнал службы.")
	}
	return stdout.buffer.String(), nil
}
