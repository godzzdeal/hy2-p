package panelmaintenance

import (
	"errors"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"time"
)

func (service *Service) reserve(input protocol.PanelRequest) (protocol.PanelOperation, error) {
	service.Mu.Lock()
	defer service.Mu.Unlock()
	if service.PortsBusy() || service.Busy() {
		return protocol.PanelOperation{}, protocol.ErrBusy
	}
	info, err := storage.Installation(service.Root)
	if err != nil {
		return protocol.PanelOperation{}, err
	}
	if (input.Action == "rollback" || input.Action == "cleanup") && !info.RollbackAvailable {
		return protocol.PanelOperation{}, errors.New("Предыдущая версия отсутствует")
	}
	if input.Action == "update" && input.Version == info.Current {
		return protocol.PanelOperation{}, errors.New("Эта версия уже установлена")
	}
	commit, err := storage.Commit(service.Root)
	if err != nil {
		return protocol.PanelOperation{}, err
	}
	operation := protocol.PanelOperation{Status: protocol.Status{ID: security.Token()[:32], Operation: input.Action, Phase: "queued", Busy: true, Started: time.Now().UTC().Format(time.RFC3339), Message: "Подготавливаем обслуживание панели"}, Version: input.Version, Commit: commit}
	if input.Action == "rollback" {
		operation.Version = info.Previous
	}
	return operation, storage.Save(service.Root, operation)
}
