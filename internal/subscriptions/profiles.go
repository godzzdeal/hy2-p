package subscriptions

import (
	"errors"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/users"
	"os"
)

type Profile struct {
	ID, Name string
	Settings configuration.Settings
}
type Connection struct {
	InstanceID string `json:"instanceId"`
	Name       string `json:"name"`
	URI        string `json:"uri"`
}

func (handler *Handler) connections(user users.User) ([]Connection, error) {
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
		profiles = []Profile{{ID: "default", Settings: settings}}
	}
	if err != nil {
		return nil, err
	}
	result := []Connection{}
	for _, profile := range profiles {
		labelled := user
		if len(profiles) > 1 {
			labelled.Name += " / " + profile.Name
		}
		uri, exportError := ConnectionURI(profile.Settings, labelled)
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
