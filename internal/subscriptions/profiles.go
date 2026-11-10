package subscriptions

import (
	"errors"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/security"
	"hy2-panel/internal/users"
	"os"
)

type Profile struct {
	ID, Name string
	Data     string
	Settings configuration.Settings
}
type Connection struct {
	InstanceID string `json:"instanceId"`
	Name       string `json:"name"`
	URI        string `json:"uri"`
}

func (handler *Handler) connections(user users.User) ([]Connection, error) {
	if handler.Announcements != nil {
		user.Name = handler.Announcements.UserName(user.Name)
	}
	var profiles []Profile
	var err error
	if handler.Sources != nil {
		profiles, err = handler.Sources()
	} else {
		var settings configuration.Settings
		settings, err = handler.Config.Get()
		if os.Getenv("PANEL_CONTAINER") == "true" {
			settings.Port, _ = deployment.Published("default")
		}
		profiles = []Profile{{ID: "default", Data: security.Env("PANEL_DATA", "data"), Settings: settings}}
	}
	if err != nil {
		return nil, err
	}
	if handler.AllowCore != nil {
		allowed := []Profile{}
		for _, profile := range profiles {
			if handler.AllowCore(user.ID, profile.ID) {
				allowed = append(allowed, profile)
			}
		}
		profiles = allowed
		if len(profiles) == 0 {
			return []Connection{}, nil
		}
	}
	result := []Connection{}
	for _, profile := range profiles {
		labelled := user
		if len(profiles) > 1 {
			labelled.Name += " / " + profile.Name
		}
		uri, exportError := ConnectionURI(profile.Settings, labelled, profile.Data)
		if exportError != nil && err == nil {
			err = exportError
		}
		if exportError == nil {
			result = append(result, Connection{InstanceID: profile.ID, Name: profile.Name, URI: uri})
		}
	}
	if len(result) == 0 {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("Нет доступных подключений для подписки: проверьте адрес, публикацию UDP-порта и режим доступа пользователей")
	}
	return result, nil
}
