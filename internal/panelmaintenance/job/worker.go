package job

import (
	"context"
	"errors"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"log"
	"os/exec"
)

func Run(root, id string) error {
	if !protocol.TicketPattern.MatchString(id) {
		return errors.New("некорректная задача")
	}
	operation, err := storage.Read(root)
	if err != nil {
		return err
	}
	if operation.ID != id {
		disableRestart(id)
		return nil
	}
	if !operation.Busy {
		disableRestart(id)
		return nil
	}
	validation := protocol.PanelRequest{Action: operation.Operation, Version: operation.Version, StorageID: operation.StorageID}
	if operation.Operation == "rollback" {
		validation.Version = ""
		validation.RestoreData = true
	}
	if err = validation.Validate(); err != nil {
		return err
	}
	if operation.Operation == "cleanup" {
		return clean(root, operation)
	}
	if operation.Operation == "backup" || operation.Operation == "backup-cloud" || operation.Operation == "check-cloud" {
		return backup(root, operation)
	}
	isRecovery := operation.Phase != "queued"
	arguments := []string{"update", operation.Version}
	if operation.Operation == "rollback" {
		arguments = []string{"rollback", "--yes"}
	}
	if isRecovery {
		arguments = []string{"start-panel"}
	}
	operation.Phase = "updating"
	if operation.Operation == "rollback" {
		operation.Phase = "rolling_back"
	}
	operation.Message = "Обновляем панель. При ошибке запуска вернётся прежняя версия"
	if operation.Operation == "rollback" {
		operation.Message = "Восстанавливаем предыдущую версию и данные из резервной копии"
	}
	if err = storage.Save(root, operation); err != nil {
		return err
	}
	err = commands.Run(root, operation.ID, security.Token()[:32], arguments...)
	if errors.Is(err, context.DeadlineExceeded) {
		log.Printf("panel maintenance timed out; recovering installation")
		err = commands.Run(root, operation.ID, security.Token()[:32], "start-panel")
		isRecovery = true
	}
	current, readErr := storage.Commit(root)
	if err == nil && (readErr != nil || storage.Version(root, current) != operation.Version) && !(isRecovery && current == operation.Commit) {
		err = errors.New("установленная версия не соответствует задаче")
	}
	operation.Busy = false
	operation.Phase = "success"
	operation.Message = "Панель обновлена. Войдите снова."
	if operation.Operation == "rollback" {
		operation.Message = "Предыдущая версия и данные восстановлены. Войдите снова."
	}
	if err != nil {
		log.Printf("panel maintenance %s: %v", operation.Operation, err)
		operation.Phase = "failed"
		operation.Message = "Операция не завершена. Проверьте журнал задачи обслуживания"
		var failure *exec.ExitError
		if operation.Operation == "update" && errors.As(err, &failure) && failure.ExitCode() == 10 {
			operation.Phase = "rolled_back"
			operation.Message = "Новая версия не запустилась. Предыдущая версия восстановлена. Войдите снова."
		}
	} else if isRecovery {
		if current == operation.Commit {
			operation.Phase = "rolled_back"
			operation.Message = "Обновление прервано. Исходная версия восстановлена. Войдите снова."
			if operation.Operation == "rollback" {
				operation.Phase = "failed"
				operation.Message = "Откат прерван. Исходная версия работает. Войдите снова."
			}
		}
	}
	if err = storage.Save(root, operation); err != nil {
		return err
	}
	disableRestart(id)
	return nil
}
func disableRestart(id string) {
	if _, err := docker("update", "--restart=no", containerName(id)); err != nil {
		log.Printf("finish maintenance worker: %v", err)
	}
}
