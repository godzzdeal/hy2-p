package service

import (
	"errors"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"hy2-panel/internal/cloudbackup/lock"
)

func (service *Service) providers(input accounts.Input) (any, error) {
	if input.Action == "providers" {
		service.Mu.Lock()
		defer service.Mu.Unlock()
		providers, err := apps.Summaries(service.Root)
		return map[string]any{"providers": providers}, err
	}
	release, err := service.writeLock()
	if err != nil {
		return nil, err
	}
	defer release()
	err = apps.Save(service.Root, apps.Application{Provider: input.Provider, ClientID: input.ClientID, Secret: input.ClientSecret, Origin: input.Origin})
	return map[string]bool{"ok": err == nil}, err
}

func (service *Service) writeLock() (func(), error) {
	service.Mu.Lock()
	if service.IsBusy() {
		service.Mu.Unlock()
		return nil, errors.New("Дождитесь завершения обслуживания панели")
	}
	release, err := lock.Acquire(service.Root)
	if err != nil {
		service.Mu.Unlock()
		return nil, err
	}
	return func() { release(); service.Mu.Unlock() }, nil
}
