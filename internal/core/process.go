package core

import (
	"database/sql"
	"errors"
	"fmt"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/ordering"
	"hy2-panel/internal/core/logs"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/core/update"
	"hy2-panel/internal/core/watchdog"
	"hy2-panel/internal/releases"
	"hy2-panel/internal/security"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

type Handler struct {
	DB         *sql.DB
	Config     *configuration.Handler
	Secret     string
	Data       string
	mu         sync.Mutex
	controlMu  sync.Mutex
	generation string
	core       *exec.Cmd
	done       chan struct{}
	logs       *logs.Buffer
	Binary     string
	Updates    *update.Service
	Watchdog   *watchdog.Monitor
}

func New(db *sql.DB, config *configuration.Handler, data, secret string) (*Handler, error) {
	handler := &Handler{DB: db, Config: config, Data: data, Secret: secret, logs: &logs.Buffer{}, Binary: security.Env("HYSTERIA_BIN", "hysteria")}
	updates, err := update.New(data, handler.Binary, handler, releases.New())
	if err != nil {
		return nil, err
	}
	handler.Updates = updates
	handler.Binary = updates.Current().Path
	handler.Watchdog = watchdog.New(handler, watchdog.DefaultPolicy())
	desired, err := supervision.ReadIntent(data)
	if err != nil {
		return nil, err
	}
	handler.Watchdog.SetDesired(desired)
	return handler, nil
}

func (handler *Handler) start() error {
	handler.mu.Lock()
	defer handler.mu.Unlock()
	if handler.core != nil {
		return errors.New("Ядро уже запущено")
	}
	settings, err := handler.Config.Get()
	if err != nil {
		return err
	}
	if err = configuration.Validate(settings); err != nil {
		return err
	}
	var document map[string]any
	yaml.Unmarshal([]byte(settings.Config), &document)
	acmehttp.Prepare(document, handler.Data, os.Getenv("PANEL_CONTAINER") == "true")
	if settings.AuthMode != "native" {
		document["auth"] = map[string]any{"type": "http", "http": map[string]any{"url": "http://127.0.0.1:8081/auth"}}
	}
	document["trafficStats"] = map[string]any{"listen": "127.0.0.1:9999", "secret": handler.Secret}
	payload, err := ordering.Marshal(document)
	if err != nil {
		return err
	}
	path := filepath.Join(handler.Data, "runtime.yaml")
	if err = os.WriteFile(path, payload, 0600); err != nil {
		return err
	}
	cmd := exec.Command(handler.Binary, "server", "-c", path)
	cmd.Stdout = handler.logs
	cmd.Stderr = handler.logs
	if err = cmd.Start(); err != nil {
		return err
	}
	handler.core = cmd
	handler.generation = security.Token()
	done := make(chan struct{})
	handler.done = done
	go func() {
		err := cmd.Wait()
		if err != nil {
			fmt.Fprintf(handler.logs, "\nCore exited: %v\n", err)
		}
		handler.mu.Lock()
		if handler.core == cmd {
			handler.core = nil
		}
		close(done)
		handler.mu.Unlock()
		if handler.Watchdog != nil {
			handler.Watchdog.NotifyExit()
		}
	}()
	return nil
}

func (handler *Handler) stop() error {
	handler.mu.Lock()
	cmd, done := handler.core, handler.done
	handler.mu.Unlock()
	if cmd == nil {
		return nil
	}
	cmd.Process.Signal(os.Interrupt)
	select {
	case <-done:
		return nil
	case <-time.After(5 * time.Second):
		cmd.Process.Kill()
		<-done
		return nil
	}
}
func (handler *Handler) Stop() error {
	handler.Watchdog.SetDesired(false)
	handler.controlMu.Lock()
	defer handler.controlMu.Unlock()
	return handler.stop()
}
