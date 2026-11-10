package panelmaintenance

import (
	"hy2-panel/internal/panelmaintenance/job"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"log"
)

func (service *Service) Recover() {
	operation, err := storage.Read(service.Root)
	if err == nil && operation.Busy {
		service.launch(operation)
	}
}
func (service *Service) launch(operation protocol.PanelOperation) {
	service.launchMu.Lock()
	defer service.launchMu.Unlock()
	active, err := storage.Read(service.Root)
	if err != nil || !active.Busy || active.ID != operation.ID {
		return
	}
	if err = job.Launch(service.Root, active); err == nil {
		return
	}
	log.Printf("launch panel maintenance: %v", err)
	active, readErr := storage.Read(service.Root)
	if readErr != nil || active.ID != operation.ID || active.Phase != "queued" {
		return
	}
	active.Busy = false
	active.Phase = "failed"
	active.Message = "Не удалось запустить задачу обслуживания. Проверьте помощник Docker"
	if err = storage.Save(service.Root, active); err != nil {
		log.Printf("save panel maintenance failure: %v", err)
	}
}
