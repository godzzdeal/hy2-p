package job

import (
	"context"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"log"
	"net/http"
	"time"
)

const storageRefreshTimeout = 30 * time.Second

func clean(root string, operation protocol.PanelOperation) error {
	operation.Phase = "cleaning"
	operation.Message = "Удаляем старые образы. Текущая версия и откат сохраняются"
	if err := storage.Save(root, operation); err != nil {
		return err
	}
	err := commands.Run(root, operation.ID, security.Token()[:32], "cleanup-images")
	if _, refreshErr := protocol.ExchangeWithTimeout[bool](context.Background(), http.MethodPost, protocol.StorageRefreshPath, nil, storageRefreshTimeout); refreshErr != nil {
		log.Printf("refresh storage after image cleanup: %v", refreshErr)
	}
	operation.Busy = false
	operation.Phase = "success"
	operation.Message = "Старые образы удалены. Текущая версия и откат сохранены."
	if err != nil {
		log.Printf("clean panel images: %v", err)
		operation.Phase = "failed"
		operation.Message = "Не удалось завершить очистку образов. Текущая версия и откат сохранены."
	}
	if err := storage.Save(root, operation); err != nil {
		return err
	}
	disableRestart(operation.ID)
	return nil
}
