package commands

import (
	"context"
	"hy2-panel/internal/portcontrol/protocol"
	processcontrol "hy2-panel/internal/process"
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
	if !ValidCommit(commit) || !ValidArguments(arguments) {
		return os.ErrInvalid
	}
	timeout := 8 * time.Minute
	if arguments[0] == "update" || arguments[0] == "rollback" || arguments[0] == "backup-cloud" {
		timeout = 30 * time.Minute
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	command := exec.CommandContext(ctx, "bash", append([]string{filepath.Join(root, "releases", commit, "scripts/server/manage.sh")}, arguments...)...)
	processcontrol.Configure(command)
	command.WaitDelay = time.Second
	// Only apply-udp sends a UDP probe. Maintenance must also clear inherited tokens.
	token, id, port := "", "", ""
	if len(arguments) > 3 && arguments[0] == "apply-udp" {
		token, id, port = probeToken, operationID, arguments[3]
	}
	command.Env = append(os.Environ(), "HY2_INSTALL_DIR="+root,
		protocol.ProbeTokenEnv+"="+token, protocol.ProbeIDEnv+"="+id, protocol.ProbePortEnv+"="+port)
	// Deployment output stays in the helper log, never in the public operation status.
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	err = command.Run()
	if ctx.Err() != nil {
		return ctx.Err()
	}
	return err
}
