package agent

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/firewall"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"hy2-panel/internal/systemmetrics"
	"hy2-panel/internal/transport"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"
)

type Agent struct {
	root   string
	mu     sync.Mutex
	status protocol.Status
	system *systemmetrics.Service
}

var rootPattern = regexp.MustCompile("^/[a-zA-Z0-9/_.-]+$")
var errBusy = errors.New("Другая операция уже выполняется")

func New(root string) (*Agent, error) {
	resolved, err := filepath.EvalSymlinks(root)
	if err != nil || resolved != root || !rootPattern.MatchString(root) || root == "/" || root == "/opt" || root == "/tmp" {
		return nil, errors.New("некорректная папка установки")
	}
	agent := &Agent{root: root}
	agent.system = systemmetrics.New(systemmetrics.Options{Data: security.Env("PANEL_DATA", "/panel-data"), Root: root, Scope: "host"})
	agent.read()
	return agent, nil
}
func (agent *Agent) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /firewall", firewall.Host(agent.root))
	mux.HandleFunc("POST /firewall", firewall.Host(agent.root))
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) })
	mux.HandleFunc("GET /udp", func(w http.ResponseWriter, r *http.Request) {
		agent.mu.Lock()
		defer agent.mu.Unlock()
		transport.Respond(w, agent.status)
	})
	mux.HandleFunc("POST /udp", agent.start)
	mux.HandleFunc("GET /udp/{ticket}", agent.history)
	mux.HandleFunc("POST "+protocol.RestartPath, agent.restartPanel)
	mux.HandleFunc("GET "+protocol.SystemPath, agent.system.Read)
	return mux
}
func (agent *Agent) start(w http.ResponseWriter, r *http.Request) {
	var request protocol.Request
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid request", 400)
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		http.Error(w, "invalid trailing data", 400)
		return
	}
	if err := request.Validate(); err != nil {
		http.Error(w, "invalid ports", 400)
		return
	}
	agent.mu.Lock()
	defer agent.mu.Unlock()
	if agent.status.Busy {
		w.WriteHeader(409)
		transport.Respond(w, agent.status)
		return
	}
	agent.status = protocol.Status{ID: randomToken(), Phase: "applying", Busy: true,
		InstanceID: request.InstanceID, Remove: request.Remove,
		PublicPort: request.PublicPort, ListenPort: request.ListenPort, Started: time.Now().UTC().Format(time.RFC3339),
		Message: "Применяем UDP-порты и проверяем соединение"}
	if err := agent.persist(); err != nil {
		agent.status.Busy = false
		http.Error(w, "cannot persist operation", 500)
		return
	}
	w.WriteHeader(202)
	transport.Respond(w, agent.status)
	go agent.run(request)
}
func (agent *Agent) Serve() error {
	ctx, cancel := context.WithCancel(context.Background())
	var workers sync.WaitGroup
	workers.Go(func() { agent.system.Run(ctx) })
	defer func() { cancel(); workers.Wait() }()
	directory := filepath.Dir(protocol.Socket)
	if err := os.MkdirAll(directory, 0750); err != nil {
		return err
	}
	if err := os.Chown(directory, 0, 10001); err != nil {
		return err
	}
	if err := os.Chmod(directory, 0750); err != nil {
		return err
	}
	os.Remove(protocol.Socket)
	listener, err := net.Listen("unix", protocol.Socket)
	if err != nil {
		return err
	}
	defer listener.Close()
	if err = os.Chown(protocol.Socket, 0, 10001); err != nil {
		return err
	}
	if err = os.Chmod(protocol.Socket, 0660); err != nil {
		return err
	}
	if agent.status.Busy {
		if agent.status.Operation == "restart" {
			go agent.runRestart("start-panel")
		} else {
			go agent.recover()
		}
	}
	server := &http.Server{Handler: agent.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 5 * time.Second, WriteTimeout: 30 * time.Second}
	return server.Serve(listener)
}
