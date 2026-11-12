package cloudbackup

import (
	"encoding/json"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"time"
)

func Storages(writer http.ResponseWriter, request *http.Request) {
	var input *accounts.Input
	if request.Method == http.MethodPost {
		input = new(accounts.Input)
		if err := transport.Decode(writer, request, input); err != nil {
			transport.Fail(writer, err, 400)
			return
		}
	}
	result, err := protocol.ExchangeWithTimeout[json.RawMessage](request.Context(), request.Method, accounts.Path, input, 25*time.Second)
	if err != nil {
		transport.Fail(writer, err, 503)
		return
	}
	transport.Respond(writer, result)
}
