package job

import (
	"context"
	"fmt"
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

const DockerTimeout = 10 * time.Second

var containerIDPattern = regexp.MustCompile(`^(?:[a-f0-9]{12}|[a-f0-9]{64})$`)

func containerName(id string) string { return "hy2-panel-maintenance-" + id }
func docker(arguments ...string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), DockerTimeout)
	defer cancel()
	return exec.CommandContext(ctx, "docker", append([]string{"--host", "unix:///var/run/docker.sock"}, arguments...)...).CombinedOutput()
}
func Launch(root string, operation protocol.PanelOperation) error {
	if !protocol.TicketPattern.MatchString(operation.ID) || !commands.ValidCommit(operation.Commit) {
		return fmt.Errorf("некорректная задача обслуживания")
	}
	name := containerName(operation.ID)
	current, err := docker("inspect", "--format", "{{.State.Status}}", name)
	if err == nil {
		switch strings.TrimSpace(string(current)) {
		case "running", "restarting":
			return nil
		default:
			_, err = docker("start", name)
			return err
		}
	}
	cleanup(root)
	arguments := []string{"run", "--detach", "--pull", "never", "--restart", "always", "--name", name,
		"--label", "io.hy2-panel.maintenance=" + security.Hash(root), "--user", "0:0",
		"--log-opt", "max-size=1m", "--log-opt", "max-file=2",
		"--mount", "type=bind,source=" + root + ",target=" + root,
		"--mount", "type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock",
		"--mount", "type=volume,source=hy2-panel_port-agent-socket,target=/run/hy2-port-agent,readonly",
		"--env", "HY2_INSTALL_DIR=" + root, "--entrypoint", "/usr/local/bin/port-agent",
		"hy2-panel:" + operation.Commit, "maintenance", operation.ID}
	_, err = docker(arguments...)
	if err != nil {
		current, inspectErr := docker("inspect", "--format", "{{.State.Running}}", name)
		if inspectErr == nil && strings.TrimSpace(string(current)) == "true" {
			return nil
		}
		return fmt.Errorf("не удалось запустить задачу обслуживания: %w", err)
	}
	return nil
}
func cleanup(root string) {
	payload, err := docker("ps", "-aq", "--filter", "label=io.hy2-panel.maintenance="+security.Hash(root), "--filter", "status=exited")
	if err != nil {
		return
	}
	for _, id := range strings.Fields(string(payload)) {
		if containerIDPattern.MatchString(id) {
			_, _ = docker("rm", id)
		}
	}
}
