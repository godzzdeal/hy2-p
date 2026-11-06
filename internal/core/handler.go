package core

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

func (handler *Handler) Status(writer http.ResponseWriter, request *http.Request) {
	handler.mu.Lock()
	running := handler.core != nil
	handler.mu.Unlock()
	handler.mu.Lock()
	bin := handler.Binary
	handler.mu.Unlock()
	path, err := exec.LookPath(bin)
	transport.Respond(writer, map[string]any{"running": running, "available": err == nil, "binary": path, "logs": handler.logs.Read(), "watchdog": handler.Watchdog.Snapshot()})
}

func (handler *Handler) Control(writer http.ResponseWriter, request *http.Request) {
	if protocol.Busy(request.Context()) {
		transport.Fail(writer, errors.New("Применение UDP-порта ещё выполняется"), 409)
		return
	}
	if !handler.controlMu.TryLock() {
		transport.Fail(writer, errors.New("Обновление или другая операция уже выполняется"), 409)
		return
	}
	defer handler.controlMu.Unlock()
	action := request.PathValue("action")
	if action != "start" && action != "stop" && action != "restart" {
		transport.Fail(writer, errors.New("Неизвестное действие"), 400)
		return
	}
	if err := supervision.SaveIntent(handler.Data, action != "stop"); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	var err error
	switch action {
	case "start":
		handler.Watchdog.SetDesired(true)
		err = handler.start()
	case "stop":
		handler.Watchdog.SetDesired(false)
		err = handler.stop()
	case "restart":
		handler.Watchdog.SetDesired(true)
		err = handler.stop()
		if err == nil {
			err = handler.start()
		}
	default:
		transport.Fail(writer, errors.New("Неизвестное действие"), 400)
		return
	}
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	handler.Status(writer, request)
}
func (handler *Handler) Logs(writer http.ResponseWriter, request *http.Request) {
	if request.Method == http.MethodDelete {
		handler.logs.Clear()
	}
	transport.Respond(writer, map[string]string{"logs": handler.logs.Read()})
}

func (handler *Handler) Versions(writer http.ResponseWriter, request *http.Request) {
	versions, err := handler.Updates.Versions(request.Context())
	if err != nil {
		transport.Fail(writer, err, http.StatusBadGateway)
		return
	}
	transport.Respond(writer, versions)
}
func (handler *Handler) UpdateStatus(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, handler.Updates.Snapshot())
}
func (handler *Handler) Update(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Version string `json:"version"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if input.Version == "" {
		transport.Fail(writer, errors.New("выберите версию"), 400)
		return
	}
	handler.beginUpdate(writer, input.Version, false)
}
func (handler *Handler) Rollback(writer http.ResponseWriter, request *http.Request) {
	handler.beginUpdate(writer, "", true)
}
func (handler *Handler) beginUpdate(writer http.ResponseWriter, version string, rollback bool) {
	if protocol.Busy(context.Background()) {
		transport.Fail(writer, errors.New("Применение UDP-порта ещё выполняется"), 409)
		return
	}
	if err := handler.Updates.Begin(version, rollback); err != nil {
		transport.Fail(writer, err, http.StatusConflict)
		return
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, handler.Updates.Snapshot())
}

func (handler *Handler) Kick(id string) {
	client := http.Client{Timeout: 2 * time.Second}
	body, _ := json.Marshal([]string{id})
	req, _ := http.NewRequest("POST", "http://127.0.0.1:9999/kick", strings.NewReader(string(body)))
	req.Header.Set("Authorization", handler.Secret)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err == nil {
		res.Body.Close()
	}
}

func (handler *Handler) ExpiryLoop(ctx context.Context) {
	supervision.ExpiryLoop(ctx, handler.DB, handler.Running, handler.Kick)
}

const HealthWindow = 3 * time.Second
const HealthPoll = 200 * time.Millisecond
const HealthRequestTimeout = time.Second

var versionExpression = regexp.MustCompile("(?:app/)?v2\\.[0-9]+\\.[0-9]+")
