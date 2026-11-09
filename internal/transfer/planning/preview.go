package planning

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/transfer/importing"
	"hy2-panel/internal/transfer/model"
	"reflect"
	"strings"
)

func Build(input, current model.Bundle) (model.Preview, error) {
	if err := model.Validate(input); err != nil {
		return model.Preview{}, err
	}
	result := model.Preview{Rows: []model.Row{}}
	blocked := map[string]bool{}
	for _, profile := range input.Profiles {
		row := model.Row{Kind: "core", ID: profile.ID, Name: profile.Name, Action: "add"}
		if target := input.Targets[profile.ID]; target != "" {
			row.Action, row.Reason = "conflict", "Выбранное ядро недоступно"
			for _, existing := range current.Profiles {
				if existing.ID == target && (existing.Settings.AuthMode != "native" || profile.Settings.AuthMode == "native") {
					row.Action, row.Reason, row.Target = "skip", "Используется выбранное ядро без изменения его настроек", target
				}
			}
			blocked[profile.ID] = row.Action == "conflict"
			result.Rows = append(result.Rows, row)
			continue
		}
		for _, existing := range current.Profiles {
			if reflect.DeepEqual(profile.Settings, existing.Settings) {
				row.Action = "skip"
				row.Target = existing.ID
				row.Reason = "Такая конфигурация уже существует"
				break
			}
			before, _ := deployment.Inspect(existing.Settings, false, "", "")
			after, _ := deployment.Inspect(profile.Settings, false, "", "")
			if strings.EqualFold(existing.Name, profile.Name) || existing.Settings.Port == profile.Settings.Port || before.UDPListenPort == after.UDPListenPort {
				row.Action, row.Reason = "conflict", "Совпадает имя, идентификатор или порт ядра"
			}
		}
		blocked[profile.ID] = row.Action == "conflict"
		result.Rows = append(result.Rows, row)
	}
	mapping := map[string]string{}
	for _, row := range result.Rows {
		if row.Target != "" {
			mapping[row.ID] = row.Target
		}
	}
	blockedGroups := map[string]bool{}
	for _, group := range input.Groups {
		row := model.Row{Kind: "group", ID: group.ID, Name: group.Name, Action: "add"}
		for _, existing := range current.Groups {
			normalized := group
			if access, ok := importing.Access(group.Access, mapping); ok {
				normalized.Access = access
			}
			if reflect.DeepEqual(group, existing) || reflect.DeepEqual(normalized, existing) {
				row.Action, row.Reason = "skip", "Группа уже существует"
				break
			}
			if existing.ID == group.ID || strings.EqualFold(existing.Name, group.Name) {
				row.Action, row.Reason = "conflict", "Имя или идентификатор группы уже заняты"
			}
		}
		if accessBlocked(group.Access.Mode, group.Access.Instances, blocked) && row.Action == "add" {
			row.Action, row.Reason = "conflict", "Есть конфликт доступных ядер"
		}
		blockedGroups[group.ID] = row.Action == "conflict"
		result.Rows = append(result.Rows, row)
	}
	for _, user := range input.Users {
		row := model.Row{Kind: "user", ID: user.ID, Name: user.Name, Action: "add"}
		for _, existing := range current.Users {
			if existing.ID == user.ID || existing.Token == user.Token || existing.Password == user.Password || strings.EqualFold(existing.Name, user.Name) {
				row.Action, row.Reason = "skip", "Совпадает пользователь, имя или данные подключения"
				break
			}
		}
		if row.Action == "add" && (blockedGroups[user.Group] || accessBlocked(user.Access.Mode, user.Access.Instances, blocked)) {
			row.Action, row.Reason = "conflict", "Есть конфликт группы или доступных ядер"
		}
		result.Rows = append(result.Rows, row)
	}
	payload, _ := json.Marshal(struct {
		Rows           []model.Row
		Current, Input model.Bundle
	}{result.Rows, identity(current), input})
	digest := sha256.Sum256(payload)
	result.Fingerprint = hex.EncodeToString(digest[:])
	return result, nil
}
func accessBlocked(mode string, ids []string, blocked map[string]bool) bool {
	if mode == "all" {
		for _, value := range blocked {
			if value {
				return true
			}
		}
		return false
	}
	for _, id := range ids {
		if blocked[id] {
			return true
		}
	}
	return false
}
func identity(bundle model.Bundle) model.Bundle {
	for index := range bundle.Users {
		bundle.Users[index].Usage = model.User{}.Usage
	}
	return bundle
}
