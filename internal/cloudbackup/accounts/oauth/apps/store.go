package apps

import (
	"errors"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Application struct {
	Provider string `json:"provider"`
	ClientID string `json:"clientId"`
	Secret   string `json:"secret,omitempty"`
	Origin   string `json:"origin"`
}
type Summary struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ClientID  string `json:"clientId"`
	HasSecret bool   `json:"hasSecret"`
	Origin    string `json:"origin"`
}

func Read(root string) ([]Application, error) {
	var applications []Application
	err := records.Read(filepath.Join(root, "cloud-backup"), "providers", &applications)
	if os.IsNotExist(err) {
		err = nil
	}
	return applications, err
}

func Get(root, id string) (Application, error) {
	applications, err := Read(root)
	if err != nil {
		return Application{}, errors.New("Не удалось прочитать настройки авторизации")
	}
	for _, application := range applications {
		if application.Provider == id {
			return application, nil
		}
	}
	return Application{}, errors.New("Сначала настройте вход для этого облачного сервиса")
}

func Save(root string, input Application) error {
	if _, err := Find(input.Provider); err != nil {
		return err
	}
	origin, err := Origin(input.Origin)
	if err != nil {
		return err
	}
	input.Origin = origin
	if input.ClientID == "" || len(input.ClientID) > 512 || len(input.Secret) > 8192 || strings.ContainsAny(input.ClientID+input.Secret, "\r\n\x00") {
		return errors.New("Укажите корректные Client ID и Client Secret")
	}
	applications, err := Read(root)
	if err != nil {
		return errors.New("Не удалось прочитать настройки авторизации")
	}
	index := -1
	for current, application := range applications {
		if application.Provider == input.Provider {
			index = current
			if input.Secret == "" && input.ClientID == application.ClientID {
				input.Secret = application.Secret
			}
			break
		}
	}
	if input.Secret == "" {
		return errors.New("Укажите Client Secret приложения")
	}
	if index < 0 {
		applications = append(applications, input)
	} else {
		applications[index] = input
	}
	directory := filepath.Join(root, "cloud-backup")
	if err = records.Write(directory, "providers", applications); err != nil {
		return err
	}
	paths, err := filepath.Glob(filepath.Join(directory, "providers-*.json"))
	if err != nil {
		return err
	}
	sort.Strings(paths)
	for _, path := range paths[:len(paths)-1] {
		if err = os.Remove(path); err != nil {
			return err
		}
	}
	return nil
}

func Summaries(root string) ([]Summary, error) {
	applications, err := Read(root)
	if err != nil {
		return nil, errors.New("Не удалось прочитать настройки авторизации")
	}
	result := make([]Summary, 0, len(Providers))
	for _, provider := range Providers {
		entry := Summary{ID: provider.ID, Name: provider.Name}
		for _, application := range applications {
			if application.Provider == provider.ID {
				entry.ClientID = application.ClientID
				entry.HasSecret = application.Secret != ""
				entry.Origin = application.Origin
			}
		}
		result = append(result, entry)
	}
	return result, nil
}
