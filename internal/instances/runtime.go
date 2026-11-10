package instances

import (
	"context"
	"database/sql"
	"errors"
	"hy2-panel/internal/certificates"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/configuration/profiles"
	"hy2-panel/internal/core"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/instances/validation"
	"hy2-panel/internal/portcontrol/protocol"
	portweb "hy2-panel/internal/portcontrol/web"
	"hy2-panel/internal/records"
	"hy2-panel/internal/security"
	"hy2-panel/internal/traffic/sources"
	"log"
	"os"
	"path/filepath"
	"sync"
)

func (registry *Registry) Get(id string) (*Instance, error) {
	if id == "" {
		id = DefaultID
	}
	if !IDPattern.MatchString(id) {
		return nil, errors.New("Экземпляр не найден")
	}
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	instance := registry.instances[id]
	if instance == nil {
		return nil, errors.New("Экземпляр не найден")
	}
	return snapshot(instance), nil
}
func Open(ctx context.Context, data string, db *sql.DB, vault *cryptovault.Vault, config *configuration.Handler, main *core.Handler) (*Registry, error) {
	registry := &Registry{directory: data, database: db, vault: vault, ctx: ctx, instances: map[string]*Instance{}}
	err := records.Read(filepath.Join(data, "instances"), "registry", &registry.definitions)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if os.IsNotExist(err) {
		registry.definitions = []Definition{{ID: DefaultID, Name: "Основной", Slot: 0}}
	}
	if err := validation.Definitions(registry.definitions); err != nil {
		return nil, err
	}
	for _, definition := range registry.definitions {
		instance := &Instance{Definition: definition, Config: config, Core: main}
		if definition.ID != DefaultID {
			directory := filepath.Join(data, "instances", definition.ID)
			instance.Config = &configuration.Handler{Vault: vault, Profile: &profiles.Store{Directory: directory, Vault: vault}}
			instance.Core, err = core.New(db, instance.Config, directory, security.Token())
			if err != nil {
				registry.Close()
				return nil, err
			}
			instance.Core.InstanceID = definition.ID
			instance.Core.StatsPort = FirstStatsPort + definition.Slot
			instance.Core.ACMEPort = FirstChallengePort + definition.Slot
		}
		registry.attach(instance)
	}
	return registry, nil
}
func (registry *Registry) attach(instance *Instance) {
	instance.Certificates = &certificates.Handler{Data: instance.Core.Data, Config: instance.Config}
	instance.Ports = &portweb.Handler{Config: instance.Config, Core: instance.Core, InstanceID: instance.ID}
	instance.Config.BeforeSave = func(settings configuration.Settings) error { return registry.validate(instance.ID, settings) }
	instance.Config.SaveLock = &registry.mu
	registry.instances[instance.ID] = instance
	ctx, cancel := context.WithCancel(registry.ctx)
	instance.cancel, instance.done = cancel, make(chan struct{})
	go func() {
		defer close(instance.done)
		instance.Core.Watchdog.Run(ctx)
	}()
}
func (instance *Instance) close() {
	instance.cancel()
	if err := instance.Core.Stop(); err != nil {
		log.Printf("Cannot stop HY2 instance %s: %v", instance.ID, err)
	}
	<-instance.done
}
func (registry *Registry) Close() {
	var workers sync.WaitGroup
	for _, instance := range registry.All() {
		workers.Go(instance.close)
	}
	workers.Wait()
}
func (registry *Registry) All() []*Instance {
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	result := make([]*Instance, 0, len(registry.definitions))
	for _, definition := range registry.definitions {
		if instance := registry.instances[definition.ID]; instance != nil {
			result = append(result, snapshot(instance))
		}
	}
	return result
}
func (registry *Registry) Generation() string {
	result := ""
	for _, instance := range registry.All() {
		result += instance.ID + instance.Core.Generation()
	}
	return result
}
func (registry *Registry) Kick(id string) {
	var workers sync.WaitGroup
	for _, instance := range registry.All() {
		workers.Add(1)
		go func(instance *Instance) { defer workers.Done(); instance.Core.Kick(id) }(instance)
	}
	workers.Wait()
}
func (registry *Registry) TrafficSources() []sources.Source {
	result := []sources.Source{}
	for _, instance := range registry.All() {
		result = append(result, sources.Source{ID: instance.ID, Address: instance.Core.StatsURL(), Secret: instance.Core.Secret, Runtime: instance.Core})
	}
	return result
}

func (registry *Registry) Reconcile(ctx context.Context) {
	for _, definition := range registry.Definitions() {
		public, _ := deployment.Published(definition.ID)
		if !definition.Removing || public != "" {
			continue
		}
		state, err := protocol.Ticket(ctx, definition.RemovalTicket)
		if definition.RemovalTicket == "" {
			state, err = protocol.Call(ctx, "GET", nil)
		}
		if err != nil || state.Busy || !state.Remove || state.InstanceID != definition.ID || state.Phase != "success" {
			continue
		}
		registry.mu.Lock()
		if current := registry.instances[definition.ID]; current != nil && current.Removing {
			registry.forget(definition.ID)
		}
		registry.mu.Unlock()
	}
}
