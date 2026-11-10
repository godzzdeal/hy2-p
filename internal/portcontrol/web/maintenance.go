package web

import (
	"errors"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
)

func Maintenance(writer http.ResponseWriter, request *http.Request) {
	if request.Method == http.MethodGet {
		result, err := protocol.Exchange[protocol.PanelInstallation](request.Context(), http.MethodGet, protocol.MaintenancePath, nil)
		if err != nil {
			transport.Respond(writer, protocol.PanelInstallation{Available: false})
			return
		}
		transport.Respond(writer, result)
		return
	}
	var input protocol.PanelRequest
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if err := input.Validate(); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	result, err := protocol.Exchange[protocol.PanelOperation](request.Context(), http.MethodPost, protocol.MaintenancePath, input)
	if err != nil {
		if errors.Is(err, protocol.ErrBusy) {
			transport.Fail(writer, err, 409)
			return
		}
		transport.Fail(writer, errors.New("Не удалось начать обслуживание панели. Проверьте помощник Docker"), 503)
		return
	}
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, result)
}
