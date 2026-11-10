package command

import (
	"bytes"
	"context"
	"errors"
	"log"
	"os/exec"
	"time"
)

const Timeout = 5 * time.Second
const MaxOutput = 256 << 10
const MaxDiagnostic = 4096

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
	return run(process)
}

func run(process *exec.Cmd) (string, error) {
	stdout := &output{}
	stderr := &output{}
	process.Stdout, process.Stderr = stdout, stderr
	if err := process.Run(); err != nil {
		diagnostic := stderr.buffer.Bytes()
		if len(diagnostic) > MaxDiagnostic {
			diagnostic = diagnostic[:MaxDiagnostic]
		}
		log.Printf("firewall command failed: program=%q args=%q error=%v stderr=%q", process.Path, process.Args[1:], err, diagnostic)
		return "", errors.New("Команда firewall не выполнена. Проверьте журнал службы.")
	}
	return stdout.buffer.String(), nil
}
