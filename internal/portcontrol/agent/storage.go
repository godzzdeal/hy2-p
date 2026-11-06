package agent

import (
	"encoding/json"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"path/filepath"
	"sort"
)

func (agent *Agent) persist() error {
	data, err := json.Marshal(agent.status)
	if err != nil {
		return err
	}
	path := filepath.Join(agent.root, "udp-operation.json")
	if err = atomicJSON(path, data); err != nil {
		return err
	}
	directory := filepath.Join(agent.root, "udp-history")
	if agent.status.ID == "" {
		return nil
	}
	if err = os.MkdirAll(directory, 0700); err != nil {
		return err
	}
	if err = atomicJSON(filepath.Join(directory, agent.status.ID+".json"), data); err != nil {
		return err
	}
	prune(directory)
	return nil
}
func atomicJSON(path string, data []byte) error {
	temporary, err := os.CreateTemp(filepath.Dir(path), ".udp-operation-")
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

const retainedOperations = 64

func prune(directory string) {
	entries, err := os.ReadDir(directory)
	if err != nil || len(entries) <= retainedOperations {
		return
	}
	sort.Slice(entries, func(first, second int) bool {
		left, leftErr := entries[first].Info()
		right, rightErr := entries[second].Info()
		return leftErr == nil && (rightErr != nil || left.ModTime().Before(right.ModTime()))
	})
	for _, entry := range entries[:len(entries)-retainedOperations] {
		os.Remove(filepath.Join(directory, entry.Name()))
	}
}
