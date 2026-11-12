package protocol

import (
	"errors"
	"regexp"
)

const MaintenancePath = "/maintenance"
const StorageRefreshPath = "/system/refresh-storage"

var PanelVersionPattern = regexp.MustCompile(`^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)

type PanelRequest struct {
	Action      string `json:"action"`
	Version     string `json:"version,omitempty"`
	RestoreData bool   `json:"restoreData,omitempty"`
}

func (request PanelRequest) Validate() error {
	switch request.Action {
	case "update":
		if len(request.Version) > 40 || !PanelVersionPattern.MatchString(request.Version) || request.RestoreData {
			return errors.New("Выберите опубликованную версию панели")
		}
	case "rollback":
		if request.Version != "" || !request.RestoreData {
			return errors.New("Подтвердите восстановление данных из резервной копии")
		}
	case "cleanup", "backup", "backup-cloud":
		if request.Version != "" || request.RestoreData {
			return errors.New("Некорректный запрос очистки образов")
		}
	default:
		return errors.New("Неизвестная операция панели")
	}
	return nil
}

type PanelOperation struct {
	Status
	Version string `json:"version,omitempty"`
	Commit  string `json:"commit,omitempty"`
}
type PanelInstallation struct {
	Available         bool           `json:"available"`
	Current           string         `json:"current"`
	Previous          string         `json:"previous"`
	BackupCreated     string         `json:"backupCreated"`
	RollbackAvailable bool           `json:"rollbackAvailable"`
	Operation         PanelOperation `json:"operation"`
}
