package useraccess

import (
	"errors"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
)

func validate(policy Policy) error {
	if policy.Mode != All && policy.Mode != Selected {
		return errors.New("Выберите режим доступа к ядрам")
	}
	if len(policy.Instances) > security.MaxCores || (policy.Mode == All && len(policy.Instances) > 0) {
		return errors.New("Некорректный список доступных ядер")
	}
	seen := map[string]bool{}
	for _, instance := range policy.Instances {
		if !protocol.InstancePattern.MatchString(instance) || seen[instance] {
			return errors.New("Некорректный список доступных ядер")
		}
		seen[instance] = true
	}
	return nil
}
