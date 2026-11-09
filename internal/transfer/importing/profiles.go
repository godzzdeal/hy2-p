package importing

import (
	"hy2-panel/internal/instances"
	"hy2-panel/internal/transfer/model"
	"hy2-panel/internal/useraccess"
	"reflect"
	"sort"
)

func Profiles(registry *instances.Registry, input, current model.Bundle, rows []model.Row) map[string]string {
	mapping := map[string]string{}
	for index, profile := range input.Profiles {
		row := &rows[index]
		if row.Action == "skip" {
			if row.Target != "" {
				mapping[profile.ID] = row.Target
				continue
			}
			for _, existing := range current.Profiles {
				if reflect.DeepEqual(profile.Settings, existing.Settings) {
					mapping[profile.ID] = existing.ID
					break
				}
			}
		}
		if row.Action != "add" {
			continue
		}
		instance, err := registry.Add(profile.Name, profile.Settings)
		if err != nil {
			row.Action, row.Reason = "failed", "Не удалось добавить ядро. Проверьте порты и пути сертификатов."
			continue
		}
		mapping[profile.ID] = instance.ID
		row.Action = "added"
	}
	return mapping
}
func Access(policy useraccess.Policy, mapping map[string]string) (useraccess.Policy, bool) {
	result := useraccess.Policy{Mode: useraccess.Selected, Instances: []string{}}
	if policy.Mode == useraccess.All {
		for _, target := range mapping {
			result.Instances = append(result.Instances, target)
		}
	} else {
		for _, source := range policy.Instances {
			target, ok := mapping[source]
			if !ok {
				return result, false
			}
			result.Instances = append(result.Instances, target)
		}
	}
	sort.Strings(result.Instances)
	return result, true
}
