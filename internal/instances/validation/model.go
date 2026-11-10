package validation

import (
	"errors"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"strings"
)

const DefaultID = "default"
const MaxInstances = security.MaxCores

type Definition struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Slot          int    `json:"slot"`
	Removing      bool   `json:"removing,omitempty"`
	RemovalTicket string `json:"removalTicket,omitempty"`
}

func Name(name string) error {
	if strings.TrimSpace(name) == "" || len([]rune(name)) > 100 || strings.ContainsAny(name, "\r\n\t") {
		return errors.New("Название экземпляра: от 1 до 100 символов в одной строке")
	}
	return nil
}
func Definitions(definitions []Definition) error {
	ids, slots := map[string]bool{}, map[int]bool{}
	if len(definitions) > MaxInstances {
		return errors.New("Превышен предел числа экземпляров")
	}
	for _, definition := range definitions {
		if !protocol.InstancePattern.MatchString(definition.ID) || ids[definition.ID] || slots[definition.Slot] ||
			definition.Slot < 0 || definition.Slot >= MaxInstances || (definition.ID == DefaultID) != (definition.Slot == 0) ||
			Name(definition.Name) != nil || (definition.ID == DefaultID && definition.Removing) ||
			(definition.RemovalTicket != "" && !protocol.TicketPattern.MatchString(definition.RemovalTicket)) {
			return errors.New("Повреждён список экземпляров: проверьте резервную копию")
		}
		ids[definition.ID], slots[definition.Slot] = true, true
	}
	if !ids[DefaultID] {
		return errors.New("В списке экземпляров отсутствует основный экземпляр")
	}
	return nil
}

type Entry struct {
	ID                     string
	Settings               configuration.Settings
	PublicPort, ListenPort string
	Removing               bool
}
