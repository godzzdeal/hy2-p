package agent

import (
	"encoding/json"
	"hy2-panel/internal/portcontrol/protocol"
	"os"
	"path/filepath"
)

func (agent *Agent) persist() error {
	data, err := json.Marshal(agent.status)
	if err != nil {
		return err
	}
	path := filepath.Join(agent.root, "udp-operation.json")
	temporary, err := os.CreateTemp(agent.root, ".udp-operation-")
	if err != nil {
		return err
	}
	defer os.Remove(temporary.Name())
	if _, err = temporary.Write(data); err == nil {
		err = temporary.Sync()
	}
	closeError := temporary.Close()
	if err != nil {
		return err
	}
	if closeError != nil {
		return closeError
	}
	return os.Rename(temporary.Name(), path)
}
func (agent *Agent) read() {
	data, err := os.ReadFile(filepath.Join(agent.root, "udp-operation.json"))
	if err == nil {
		json.Unmarshal(data, &agent.status)
	}
	if agent.status.Phase == "" {
		agent.status = protocol.Status{Phase: "idle"}
	}
}
