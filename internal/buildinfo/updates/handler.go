package updates

import (
	"hy2-panel/internal/transport"
	"net/http"
)

func (service *Service) Read(writer http.ResponseWriter, request *http.Request) {
	snapshot, err := service.Check(request.Context())
	if err != nil {
		transport.Fail(writer, err, http.StatusBadGateway)
		return
	}
	transport.Respond(writer, snapshot)
}
