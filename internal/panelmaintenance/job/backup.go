package job

import (
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"log"
)

func backup(root string, operation protocol.PanelOperation) error {
	// Do not repeat an upload after a worker restart: its completion may be unknown.
	if operation.Phase != "queued" {
		if err := recoverBackup(root, operation); err != nil {
			log.Printf("recover panel after interrupted backup: %v", err)
		}
		operation.Busy = false
		operation.Phase = "failed"
		operation.Message = "Резервное копирование прервано. Локальные копии сохранены; повторите операцию"
	} else {
		operation.Phase = "updating"
		operation.Message = "Создаём резервную копию. Панель кратковременно перезапустится"
		if operation.Operation == "backup-cloud" {
			operation.Message = "Создаём копию и отправляем в облако"
		}
		if operation.Operation == "check-cloud" {
			operation.Message = "Проверяем доступ к облачному хранилищу"
		}
		if err := storage.Save(root, operation); err != nil {
			return err
		}
		arguments := []string{operation.Operation}
		if operation.StorageID != "" {
			arguments = append(arguments, operation.StorageID)
		}
		err := commands.Run(root, operation.ID, security.Token()[:32], arguments...)
		operation.Busy = false
		operation.Phase = "success"
		operation.Message = "Резервная копия создана"
		if operation.Operation == "backup-cloud" {
			operation.Message = "Резервная копия отправлена в облако и проверена"
		}
		if operation.Operation == "check-cloud" {
			operation.Message = "Доступ к хранилищу проверен"
		}
		if err != nil {
			log.Printf("backup task: %v", err)
			if recoveryErr := recoverBackup(root, operation); recoveryErr != nil {
				log.Printf("restart panel after backup error: %v", recoveryErr)
			}
			operation.Phase = "failed"
			operation.Message = "Не удалось завершить резервное копирование. Проверьте журнал задачи; созданные локальные копии сохранены"
			if operation.Operation == "check-cloud" {
				operation.Message = "Не удалось проверить доступ к хранилищу. Проверьте журнал задачи"
			}
		}
	}
	if err := storage.Save(root, operation); err != nil {
		return err
	}
	disableRestart(operation.ID)
	return nil
}

func recoverBackup(root string, operation protocol.PanelOperation) error {
	if operation.Operation == "check-cloud" {
		return nil
	}
	return commands.Run(root, operation.ID, "", "start-panel")
}
