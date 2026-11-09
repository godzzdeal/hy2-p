package model

import (
	"errors"
	"hy2-panel/internal/configuration"
	deviceModel "hy2-panel/internal/devices/model"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/instances/validation"
	"hy2-panel/internal/security"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/useraccess"
	"strings"
	"time"
)

func Validate(bundle Bundle) error {
	if bundle.Format != Format || len(bundle.Users) > MaxUsers || len(bundle.Profiles) == 0 || len(bundle.Profiles) > security.MaxCores || len(bundle.Groups) > groups.MaxGroups {
		return errors.New("Неподдерживаемый формат или слишком большой файл импорта")
	}
	cores, groupIDs, userIDs, credentials, tokens := map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]bool{}
	for _, profile := range bundle.Profiles {
		if !validationID(profile.ID) || cores[profile.ID] || validation.Name(profile.Name) != nil || configuration.Validate(profile.Settings) != nil {
			return errors.New("Некорректная конфигурация ядра в файле")
		}
		cores[profile.ID] = true
	}
	for source, target := range bundle.Targets {
		if !cores[source] || !validationID(target) {
			return errors.New("Некорректные связи ядер")
		}
	}
	for _, group := range bundle.Groups {
		if groupIDs[group.ID] || group.Validate() != nil || !knownAccess(group.Access, cores) {
			return errors.New("Некорректная группа в файле")
		}
		groupIDs[group.ID] = true
	}
	for _, user := range bundle.Users {
		if !groups.IDPattern.MatchString(user.ID) || userIDs[user.ID] || strings.TrimSpace(user.Name) == "" || len(user.Name) > 100 ||
			len(user.Password) < 12 || len(user.Password) > 128 || len(user.Token) < 32 || len(user.Token) > 128 || credentials[user.Password] || tokens[user.Token] ||
			(user.Group != "" && !groupIDs[user.Group]) || user.Access.Validate() != nil || !knownAccess(user.Access, cores) ||
			user.DeviceLimit < 0 || user.DeviceLimit > deviceModel.MaxDevices || user.Usage.Upload > traffic.MaxSafeBytes ||
			user.Usage.Download > traffic.MaxSafeBytes-user.Usage.Upload || user.Usage.Limit > traffic.MaxSafeBytes {
			return errors.New("Некорректные данные пользователя в файле")
		}
		for _, timestamp := range []string{user.Expires, user.Created} {
			if timestamp != "" {
				if _, err := time.Parse(time.RFC3339, timestamp); err != nil {
					return errors.New("Некорректная дата пользователя")
				}
			}
		}
		for _, character := range user.Token {
			if !strings.ContainsRune("0123456789abcdef", character) {
				return errors.New("Некорректный токен подписки")
			}
		}
		userIDs[user.ID], credentials[user.Password], tokens[user.Token] = true, true, true
	}
	return nil
}
func validationID(id string) bool { return id == "default" || groups.IDPattern.MatchString(id) }
func knownAccess(policy useraccess.Policy, cores map[string]bool) bool {
	for _, id := range policy.Instances {
		if !cores[id] {
			return false
		}
	}
	return true
}
