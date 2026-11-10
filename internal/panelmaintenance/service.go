package panelmaintenance

import (
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"sync"
)

type Service struct {
	Root      string
	Mu        *sync.Mutex
	PortsBusy func() bool
	launchMu  sync.Mutex
}

func (service *Service) Busy() bool {
	operation, err := storage.Read(service.Root)
	return err != nil || operation.Busy
}
func (service *Service) Status() protocol.Status {
	operation, err := storage.Read(service.Root)
	if err != nil {
		return protocol.Status{Busy: true, Phase: "failed", Message: "Состояние обслуживания панели недоступно"}
	}
	return operation.Status
}
func (service *Service) Read(writer http.ResponseWriter, request *http.Request) {
	result, err := storage.Installation(service.Root)
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, result)
}
func (service *Service) Begin(writer http.ResponseWriter, request *http.Request) {
	var input protocol.PanelRequest
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if err := input.Validate(); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	operation, err := service.reserve(input)
	if err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	go service.launch(operation)
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, operation)
}
