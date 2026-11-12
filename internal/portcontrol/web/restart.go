package web

import (
	"errors"
	"fmt"
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
		transport.Fail(writer, fmt.Errorf("Не удалось запустить перезапуск панели: %w", err), http.StatusServiceUnavailable)
		return
	}
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, status)
}
