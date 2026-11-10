package commands

import (
	"context"
	"hy2-panel/internal/portcontrol/protocol"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func Run(root, operationID, probeToken string, arguments ...string) error {
	data, err := os.ReadFile(filepath.Join(root, "current"))
	if err != nil {
		return err
	}
	commit := strings.TrimSpace(string(data))
	if !ValidCommit(commit) || len(arguments) == 0 || !ValidCommand(arguments[0]) {
		return os.ErrInvalid
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()
	command := exec.CommandContext(ctx, "bash", append([]string{filepath.Join(root, "releases", commit, "scripts/server/manage.sh")}, arguments...)...)
	command.Env = append(os.Environ(), "HY2_INSTALL_DIR="+root,
		protocol.ProbeTokenEnv+"="+probeToken, protocol.ProbeIDEnv+"="+operationID)
	if len(arguments) > 3 && arguments[0] == "apply-udp" {
		command.Env = append(command.Env, protocol.ProbePortEnv+"="+arguments[3])
	}
	// Deployment output stays in the helper log, never in the public operation status.
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	return command.Run()
}
