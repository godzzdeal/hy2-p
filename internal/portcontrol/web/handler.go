package web

import (
	"errors"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/core"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
)

type Handler struct {
	InstanceID string
	Config     *configuration.Handler
	Core       *core.Handler
}

func (handler *Handler) Apply(w http.ResponseWriter, r *http.Request) {
	var input protocol.Request
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	settings, err := handler.Config.Get()
	if err != nil {
		transport.Fail(w, err, 500)
		return
	}
	public, target := deployment.Published(handler.InstanceID)
	snapshot, err := deployment.Inspect(settings, os.Getenv("PANEL_CONTAINER") == "true", public, target)
	if err != nil || !snapshot.Container || snapshot.UDPWarning != "" {
		transport.Fail(w, errors.New("Автоматическое применение недоступно для этих настроек listen"), 400)
		return
	}
	if input.PublicPort != snapshot.UDPPublicPort || input.ListenPort != snapshot.UDPListenPort {
		transport.Fail(w, errors.New("Сначала сохраните выбранные UDP-порты"), 409)
		return
	}
	// A deliberately stopped core has nothing to verify. Docker's authenticated
	// UDP preflight still checks the mapping before normal startup is allowed.
	if (handler.Core.Running() || handler.Core.Watchdog.Snapshot().DesiredRunning) &&
		(!handler.Core.PortChangesOnly(settings) || !handler.Core.Healthy(r.Context())) {
		transport.Fail(w, errors.New("Остановите ядро или примените остальные настройки его перезапуском"), 409)
		return
	}
	input.InstanceID = handler.InstanceID
	input.Remove = false
	result, err := protocol.Call(r.Context(), "POST", &input)
	if err != nil {
		transport.Fail(w, errors.New("Помощник применения UDP-порта недоступен или занят"), 503)
		return
	}
	w.WriteHeader(http.StatusAccepted)
	transport.Respond(w, result)
}

// Status is a read-only progress ticket. It reveals no configuration or credentials.
func Status(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("ticket")
	if !protocol.TicketPattern.MatchString(id) {
		transport.Fail(w, errors.New("Проверка больше не доступна. Обновите состояние портов в конфигурации"), 404)
		return
	}
	result, err := protocol.Ticket(r.Context(), id)
	if errors.Is(err, protocol.ErrNotFound) {
		transport.Fail(w, err, 404)
		return
	}
	if err != nil {
		transport.Fail(w, errors.New("Помощник временно недоступен"), 503)
		return
	}
	transport.Respond(w, result)
}
