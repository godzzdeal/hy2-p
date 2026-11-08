package groups

import (
	"errors"
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/useraccess"
	"regexp"
	"strings"
)

const MaxGroups = 64

var IDPattern = regexp.MustCompile(`^[a-f0-9]{16}$`)
var Colors = map[string]bool{"cyan": true, "blue": true, "green": true, "amber": true, "purple": true, "gray": true}

type Group struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Color        string            `json:"color"`
	Access       useraccess.Policy `json:"access"`
	TrafficLimit uint64            `json:"trafficLimit"`
	DeviceLimit  int               `json:"deviceLimit"`
}
type Snapshot struct {
	Groups      []Group           `json:"groups"`
	Memberships map[string]string `json:"memberships"`
}

func (group Group) Validate() error {
	if !IDPattern.MatchString(group.ID) || len(strings.TrimSpace(group.Name)) == 0 || len(group.Name) > 100 || !Colors[group.Color] {
		return errors.New("Укажите имя и цвет группы")
	}
	if group.DeviceLimit < 0 || group.DeviceLimit > model.MaxDevices || group.TrafficLimit > traffic.MaxSafeBytes {
		return errors.New("Некорректные лимиты группы")
	}
	return group.Access.Validate()
}
