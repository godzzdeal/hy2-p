package agent

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"hy2-panel/internal/portcontrol/history"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"path/filepath"
)

func (agent *Agent) persist() error {
	data, err := json.Marshal(agent.status)
	if err != nil {
		return err
	}
	path := filepath.Join(agent.root, "udp-operation.json")
	if err = history.Atomic(path, data); err != nil {
		return err
	}
	directory := filepath.Join(agent.root, "udp-history")
	if agent.status.ID == "" {
		return nil
	}
	if err = os.MkdirAll(directory, 0700); err != nil {
		return err
	}
	if err = history.Atomic(filepath.Join(directory, agent.status.ID+".json"), data); err != nil {
		return err
	}
	history.Prune(directory)
	return nil
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

func (agent *Agent) history(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("ticket")
	if !protocol.TicketPattern.MatchString(id) {
		http.NotFound(writer, request)
		return
	}
	agent.mu.Lock()
	defer agent.mu.Unlock()
	if agent.status.ID == id {
		transport.Respond(writer, agent.status)
		return
	}
	data, err := os.ReadFile(filepath.Join(agent.root, "udp-history", id+".json"))
	var status protocol.Status
	if err != nil || json.Unmarshal(data, &status) != nil {
		http.NotFound(writer, request)
		return
	}
	transport.Respond(writer, status)
}

func randomToken() string {
	var data [16]byte
	if _, err := rand.Read(data[:]); err != nil {
		panic(err)
	}
	return hex.EncodeToString(data[:])
}
