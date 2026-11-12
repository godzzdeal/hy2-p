package cloudbackup

import (
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
)

func Panel(writer http.ResponseWriter, request *http.Request) {
	var input *Config
	if request.Method == http.MethodPut {
		input = new(Config)
		if err := transport.Decode(writer, request, input); err != nil {
			transport.Fail(writer, err, 400)
			return
		}
	}
	result, err := protocol.Exchange[map[string]any](request.Context(), request.Method, Path, input)
	if err != nil {
		transport.Fail(writer, err, 503)
		return
	}
	transport.Respond(writer, result)
}
