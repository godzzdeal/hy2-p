package catalog

import (
	"hy2-panel/internal/transport"
	"net/http"
)

func (service *Service) Read(writer http.ResponseWriter, request *http.Request) {
	result, err := service.List(request.Context())
	if err != nil {
		transport.Fail(writer, err, 502)
		return
	}
	transport.Respond(writer, result)
}
