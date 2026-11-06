package agent

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"hy2-panel/internal/portcontrol/protocol"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var commitPattern = regexp.MustCompile("^[a-f0-9]{40}$")

func randomToken() string {
	var data [16]byte
	if _, err := rand.Read(data[:]); err != nil {
		panic(err)
	}
	return hex.EncodeToString(data[:])
}
func (agent *Agent) execute(arguments ...string) error {
	data, err := os.ReadFile(filepath.Join(agent.root, "current"))
	if err != nil {
		return err
	}
	commit := strings.TrimSpace(string(data))
	if !commitPattern.MatchString(commit) {
		return os.ErrInvalid
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()
	command := exec.CommandContext(ctx, "bash", append([]string{filepath.Join(agent.root, "releases", commit, "scripts/server/manage.sh")}, arguments...)...)
	command.Env = append(os.Environ(), "HY2_INSTALL_DIR="+agent.root,
		protocol.ProbeTokenEnv+"="+randomToken(), protocol.ProbeIDEnv+"="+agent.status.ID)
	// Deployment output stays in the helper log, never in the public operation status.
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	return command.Run()
}
func (agent *Agent) finish(err error) {
	agent.mu.Lock()
	defer agent.mu.Unlock()
	agent.status.Busy = false
	switch {
	case err == nil:
		agent.status.Phase = "success"
		agent.status.Message = "UDP-порт применён. Локальная проверка UDP и ядра пройдена."
		agent.status.UDPChecked = true
		agent.status.CoreChecked = true
	case exitCode(err) == 10:
		agent.status.Phase = "rolled_back"
		agent.status.Message = "Проверка не прошла. Прежние UDP-порты восстановлены."
	default:
		agent.status.Phase = "failed"
		agent.status.Message = "Не удалось применить или восстановить UDP-порт. Проверьте журнал помощника."
	}
	agent.persist()
}
func exitCode(err error) int {
	if value, ok := err.(*exec.ExitError); ok {
		return value.ExitCode()
	}
	return -1
}
func (agent *Agent) run(request protocol.Request) {
	time.Sleep(time.Second)
	agent.finish(agent.execute("apply-udp", agent.status.ID, request.PublicPort, request.ListenPort))
}
func (agent *Agent) recover() {
	// An interrupted transaction is rolled back before accepting another change.
	agent.finish(agent.execute("recover-udp", agent.status.ID))
}
