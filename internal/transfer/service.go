package transfer

import (
	"context"
	"errors"
	"hy2-panel/internal/devices"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transfer/importing"
	"hy2-panel/internal/transfer/model"
	"hy2-panel/internal/transfer/planning"
	"hy2-panel/internal/useraccess"
	"hy2-panel/internal/users"
	"sync"
)

type Service struct {
	mu       sync.Mutex
	Users    *users.Handler
	Registry *instances.Registry
	Groups   *groups.Store
	Access   *useraccess.Store
	Devices  *devices.Store
	Traffic  *traffic.Service
}

func (service *Service) Preview(bundle model.Bundle) (model.Preview, error) {
	current, err := service.Export()
	if err != nil {
		return model.Preview{}, err
	}
	return planning.Build(bundle, current)
}
func (service *Service) Apply(bundle model.Bundle, fingerprint string) (model.Preview, error) {
	if !service.mu.TryLock() {
		return model.Preview{}, errors.New("Импорт уже выполняется. Дождитесь его завершения")
	}
	defer service.mu.Unlock()
	if protocol.Busy(context.Background()) {
		return model.Preview{}, errors.New("Дождитесь завершения сетевой операции")
	}
	current, err := service.Export()
	if err != nil {
		return model.Preview{}, err
	}
	preview, err := planning.Build(bundle, current)
	if err != nil {
		return preview, err
	}
	if preview.Fingerprint != fingerprint {
		return preview, errors.New("Данные изменились. Повторите предварительный просмотр")
	}
	mapping := importing.Profiles(service.Registry, bundle, current, preview.Rows)
	availableGroups := map[string]bool{}
	for index, group := range bundle.Groups {
		row := &preview.Rows[len(bundle.Profiles)+index]
		if row.Action == "skip" {
			availableGroups[group.ID] = true
			continue
		}
		if row.Action != "add" {
			continue
		}
		access, ok := importing.Access(group.Access, mapping)
		if !ok || (group.Access.Mode == useraccess.All && len(mapping) != len(bundle.Profiles)) {
			row.Action, row.Reason = "failed", "Экземпляр группы не был добавлен"
			continue
		}
		group.Access = access
		if err := service.Groups.Put(group); err != nil {
			row.Action, row.Reason = "failed", "Не удалось добавить группу"
			continue
		}
		availableGroups[group.ID], row.Action = true, "added"
	}
	for index, entry := range bundle.Users {
		row := &preview.Rows[len(bundle.Profiles)+len(bundle.Groups)+index]
		if row.Action != "add" {
			continue
		}
		access, ok := importing.Access(entry.Access, mapping)
		if !ok || (entry.Access.Mode == useraccess.All && len(mapping) != len(bundle.Profiles)) || (entry.Group != "" && !availableGroups[entry.Group]) {
			row.Action, row.Reason = "failed", "Группа или экземпляр пользователя не были добавлены"
			continue
		}
		user := users.User{ID: entry.ID, Name: entry.Name, Enabled: entry.Enabled, Expires: entry.Expires, Created: entry.Created, Password: entry.Password, Token: entry.Token}
		err := importing.Account(service.Users, user, func() error {
			if err := service.Access.Put(entry.ID, access); err != nil {
				return err
			}
			if err := service.Devices.SetLimit(entry.ID, entry.DeviceLimit); err != nil {
				return err
			}
			if err := service.Traffic.ImportUsage(entry.ID, entry.Usage); err != nil {
				return err
			}
			return service.Groups.Assign(entry.ID, entry.Group)
		})
		if err != nil {
			row.Action, row.Reason = "failed", "Не удалось добавить пользователя; существующие записи не изменены"
			continue
		}
		row.Action = "added"
	}
	return preview, nil
}
