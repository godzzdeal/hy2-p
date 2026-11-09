package api

import (
	"errors"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/core/watchdog"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
)

type Handler struct{ Registry *instances.Registry }
type Summary struct {
	instances.Definition
	Watchdog           watchdog.Snapshot `json:"watchdog"`
	Running            bool              `json:"running"`
	DesiredRunning     bool              `json:"desiredRunning"`
	Version            string            `json:"version"`
	Updating           bool              `json:"updating"`
	Host               string            `json:"host"`
	Port               string            `json:"port"`
	ListenPort         string            `json:"listenPort"`
	PublishedPort      string            `json:"publishedPort"`
	PortChangeRequired bool              `json:"portChangeRequired"`
	AuthMode           string            `json:"authMode"`
	Error              string            `json:"error,omitempty"`
}

func (handler Handler) networkReady(w http.ResponseWriter, r *http.Request) bool {
	for _, instance := range handler.Registry.All() {
		if instance.Core.Updates.Snapshot().Busy {
			transport.Fail(w, errors.New("Дождитесь завершения обновлений всех ядер"), 409)
			return false
		}
	}
	return true
}

func (handler Handler) List(w http.ResponseWriter, r *http.Request) {
	handler.Registry.Reconcile(r.Context())
	result := []Summary{}
	for _, definition := range handler.Registry.Definitions() {
		instance, err := handler.Registry.Get(definition.ID)
		if err != nil {
			continue
		}
		update := instance.Core.Updates.Snapshot()
		item := Summary{Definition: definition, Running: instance.Core.Running(), Version: update.Current, Updating: update.Busy}
		item.DesiredRunning = instance.Core.Watchdog.Snapshot().DesiredRunning
		item.Watchdog = instance.Core.Watchdog.Snapshot()
		settings, err := instance.Config.Get()
		if err == nil {
			item.Host, item.Port, item.AuthMode = settings.Host, settings.Port, settings.AuthMode
			public, target := deployment.Published(definition.ID)
			var snapshot deployment.Snapshot
			snapshot, err = deployment.Inspect(settings, os.Getenv("PANEL_CONTAINER") == "true", public, target)
			item.ListenPort, item.PublishedPort, item.PortChangeRequired = snapshot.UDPListenPort, public, snapshot.UDPRestartRequired
		}
		if err != nil {
			item.Error = "Не удалось прочитать конфигурацию ядра"
		}
		result = append(result, item)
	}
	transport.Respond(w, result)
}
func (handler Handler) Create(w http.ResponseWriter, r *http.Request) {
	if protocol.Busy(r.Context()) {
		transport.Fail(w, errors.New("Дождитесь завершения сетевой операции"), 409)
		return
	}
	var input struct {
		Name     string                 `json:"name"`
		Settings configuration.Settings `json:"settings"`
	}
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	instance, err := handler.Registry.Add(input.Name, input.Settings)
	if err != nil {
		transport.Fail(w, err, 409)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	transport.Respond(w, map[string]string{"id": instance.ID})
}
func (handler Handler) Rename(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name string `json:"name"`
	}
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if err := handler.Registry.Rename(r.PathValue("instance"), input.Name); err != nil {
		transport.Fail(w, err, 409)
		return
	}
	transport.Respond(w, map[string]bool{"ok": true})
}
func (handler Handler) Remove(w http.ResponseWriter, r *http.Request) {
	if !handler.networkReady(w, r) {
		return
	}
	state, err := handler.Registry.Remove(r.Context(), r.PathValue("instance"))
	if err != nil {
		transport.Fail(w, err, 409)
		return
	}
	if state != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
	}
	transport.Respond(w, map[string]any{"removed": state == nil, "operation": state})
}
