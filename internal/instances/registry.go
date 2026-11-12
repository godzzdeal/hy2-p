package instances

import (
	"context"
	"errors"
	"hy2-panel/internal/certificates"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/configuration/profiles"
	"hy2-panel/internal/core"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/instances/validation"
	"hy2-panel/internal/mimic"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"os"
	"path/filepath"
	"strings"
)

func (registry *Registry) Add(name string, settings configuration.Settings) (*Instance, error) {
	if err := validation.Name(name); err != nil {
		return nil, err
	}
	if err := configuration.Validate(settings); err != nil {
		return nil, err
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	if err := registry.validate("", settings); err != nil {
		return nil, err
	}
	if len(registry.definitions) >= validation.MaxInstances {
		return nil, errors.New("Достигнут предел: 8 экземпляров")
	}
	slot := 1
	used := map[int]bool{}
	for _, definition := range registry.definitions {
		used[definition.Slot] = true
	}
	for used[slot] {
		slot++
	}
	definition := Definition{ID: security.Token()[:16], Name: strings.TrimSpace(name), Slot: slot}
	for registry.instances[definition.ID] != nil {
		definition.ID = security.Token()[:16]
	}
	directory := filepath.Join(registry.directory, "instances", definition.ID)
	settings, err := certificates.Clone(settings, registry.directory, directory)
	if err != nil {
		os.RemoveAll(directory)
		return nil, err
	}
	config := &configuration.Handler{Vault: registry.vault, Profile: &profiles.Store{Directory: directory, Vault: registry.vault}}
	if err := config.Profile.Put(settings); err != nil {
		os.RemoveAll(directory)
		return nil, err
	}
	runtime, err := core.New(registry.database, config, directory, security.Token())
	if err != nil {
		os.RemoveAll(directory)
		return nil, err
	}
	runtime.InstanceID = definition.ID
	runtime.StatsPort = security.FirstStatsPort + slot
	runtime.ACMEPort = security.FirstChallengePort + slot
	instance := &Instance{Definition: definition, Config: config, Core: runtime}
	registry.definitions = append(registry.definitions, definition)
	if err := registry.save(); err != nil {
		registry.definitions = registry.definitions[:len(registry.definitions)-1]
		os.RemoveAll(directory)
		return nil, err
	}
	registry.attach(instance)
	return snapshot(instance), nil
}

// Copy mutable registry metadata while its lock is held; runtimes remain shared.
func snapshot(instance *Instance) *Instance {
	result := *instance
	return &result
}

func (registry *Registry) Remove(ctx context.Context, id string) (*protocol.Status, error) {
	if os.Getenv(mimic.EnabledEnv) == "true" && os.Getenv(mimic.InstanceEnv) == id {
		return nil, errors.New("Сначала отключите режим установки Mimic для этого экземпляра")
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	instance := registry.instances[id]
	if id == DefaultID || instance == nil {
		return nil, errors.New("Основный экземпляр нельзя удалить")
	}
	if instance.Core.Running() || instance.Core.Watchdog.Snapshot().DesiredRunning || instance.Core.Updates.Snapshot().Busy {
		return nil, errors.New("Сначала остановите экземпляр и дождитесь завершения его обновления")
	}
	public, target := deployment.Published(id)
	if public == "" && !instance.Removing {
		return nil, registry.forget(id)
	}
	var state protocol.Status
	var err error
	if public == "" && instance.RemovalTicket != "" {
		state, err = protocol.Ticket(ctx, instance.RemovalTicket)
	} else {
		state, err = protocol.Call(ctx, "GET", nil)
	}
	if err != nil {
		return nil, err
	}
	if state.Busy {
		if state.InstanceID == id && state.Remove {
			return &state, nil
		}
		return nil, errors.New("Сетевая операция ещё выполняется")
	}
	if public == "" {
		if state.InstanceID == id && state.Remove && state.Phase == "success" {
			return nil, registry.forget(id)
		}
		return nil, errors.New("Дождитесь завершения или восстановления сетевой операции")
	}
	if err = supervision.SaveIntent(instance.Core.Data, false); err != nil {
		return nil, err
	}
	previous := append([]Definition(nil), registry.definitions...)
	wasRemoving := instance.Removing
	instance.Removing = true
	for index := range registry.definitions {
		if registry.definitions[index].ID == id {
			registry.definitions[index].Removing = true
		}
	}
	if err = registry.save(); err != nil {
		instance.Removing, registry.definitions = wasRemoving, previous
		return nil, err
	}
	state, err = protocol.Call(ctx, "POST", &protocol.Request{InstanceID: id, Remove: true, PublicPort: public, ListenPort: target})
	if err == nil {
		instance.RemovalTicket = state.ID
		for index := range registry.definitions {
			if registry.definitions[index].ID == id {
				registry.definitions[index].RemovalTicket = state.ID
			}
		}
		err = registry.save()
	}
	return &state, err
}
