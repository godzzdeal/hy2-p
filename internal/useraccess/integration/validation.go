package integration

import (
	"errors"
	"hy2-panel/internal/useraccess"
)

func (handler *Handler) validate(policy useraccess.Policy) error {
	if err := policy.Validate(); err != nil {
		return err
	}
	for _, id := range policy.Instances {
		instance, err := handler.Registry.Get(id)
		if err != nil {
			return errors.New("Экземпляр больше недоступен. Обновите список")
		}
		for _, definition := range handler.Registry.Definitions() {
			if definition.ID == id && definition.Removing {
				return errors.New("Экземпляр ожидает удаления")
			}
		}
		settings, err := instance.Config.Get()
		if err != nil {
			return errors.New("Не удалось проверить конфигурацию экземпляра")
		}
		if settings.AuthMode == "native" {
			return errors.New("Доступ к этому экземпляру задаётся в его конфигурации")
		}
	}
	return nil
}
