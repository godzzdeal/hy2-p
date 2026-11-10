package web

import (
	"errors"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
)

func Restart(writer http.ResponseWriter, request *http.Request) {
	status, err := protocol.Exchange[protocol.Status](request.Context(), http.MethodPost, protocol.RestartPath, nil)
	if err != nil {
		if errors.Is(err, protocol.ErrBusy) {
			transport.Fail(writer, err, http.StatusConflict)
			return
		}
		transport.Fail(writer, errors.New("Не удалось запустить перезапуск панели. Проверьте помощник Docker"), http.StatusServiceUnavailable)
		return
	}
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, status)
}
