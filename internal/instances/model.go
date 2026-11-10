package instances

import (
	"context"
	"database/sql"
	"errors"
	"hy2-panel/internal/certificates"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/core"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/instances/validation"
	"hy2-panel/internal/portcontrol/protocol"
	portweb "hy2-panel/internal/portcontrol/web"
	"hy2-panel/internal/records"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const DefaultID = validation.DefaultID
const MaxInstances = validation.MaxInstances
const FirstStatsPort = security.FirstStatsPort
const FirstChallengePort = security.FirstChallengePort

var IDPattern = protocol.InstancePattern

type Definition = validation.Definition
type Instance struct {
	Definition
	Config       *configuration.Handler
	Core         *core.Handler
	Certificates *certificates.Handler
	Ports        *portweb.Handler
	cancel       context.CancelFunc
	done         chan struct{}
}
type Registry struct {
	mu          sync.RWMutex
	directory   string
	database    *sql.DB
	vault       *cryptovault.Vault
	ctx         context.Context
	instances   map[string]*Instance
	definitions []Definition
}

// validate is called with the registry write lock held through configuration persistence.
func (registry *Registry) validate(id string, settings configuration.Settings) error {
	if id != "" && registry.instances[id] == nil {
		return errors.New("Экземпляр не найден")
	}
	if current := registry.instances[id]; current != nil && current.Removing {
		return errors.New("Экземпляр ожидает удаления UDP-порта")
	}
	entries := []validation.Entry{}
	for _, instance := range registry.instances {
		saved, err := instance.Config.Get()
		if err != nil {
			return err
		}
		public, target := deployment.Published(instance.ID)
		entries = append(entries, validation.Entry{ID: instance.ID, Settings: saved, PublicPort: public, ListenPort: target, Removing: instance.Removing})
	}
	if err := validation.Ports(id, settings, entries); err != nil {
		return err
	}
	return validation.ACME(id, settings, entries)
}

func (registry *Registry) WithCore(id string, writer http.ResponseWriter, request *http.Request, handler func(*Instance) http.HandlerFunc) {
	if id == "" {
		id = DefaultID
	}
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	instance := registry.instances[id]
	if instance == nil || instance.Removing {
		transport.Fail(writer, errors.New("Экземпляр недоступен или ожидает удаления"), http.StatusConflict)
		return
	}
	handler(instance)(writer, request)
}
func (registry *Registry) Definitions() []Definition {
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	return append([]Definition(nil), registry.definitions...)
}

func (registry *Registry) Rename(id, name string) error {
	if err := validation.Name(name); err != nil {
		return err
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	instance := registry.instances[id]
	if instance == nil {
		return errors.New("Экземпляр не найден")
	}
	var previous string
	for index := range registry.definitions {
		if registry.definitions[index].ID == id {
			previous = registry.definitions[index].Name
			registry.definitions[index].Name = strings.TrimSpace(name)
		}
	}
	if err := registry.save(); err != nil {
		for index := range registry.definitions {
			if registry.definitions[index].ID == id {
				registry.definitions[index].Name = previous
			}
		}
		return err
	}
	instance.Name = strings.TrimSpace(name)
	return nil
}

func (registry *Registry) forget(id string) error {
	previous := registry.definitions
	next := make([]Definition, 0, len(previous))
	for _, definition := range previous {
		if definition.ID != id {
			next = append(next, definition)
		}
	}
	registry.definitions = next
	if err := registry.save(); err != nil {
		registry.definitions = previous
		return err
	}
	if instance := registry.instances[id]; instance != nil && instance.cancel != nil {
		instance.close()
		if err := os.RemoveAll(instance.Core.Data); err != nil {
			log.Printf("Cannot remove retired core %s data: %v", id, err)
		}
	}
	delete(registry.instances, id)
	return nil
}

func (registry *Registry) save() error {
	return records.Write(filepath.Join(registry.directory, "instances"), "registry", registry.definitions)
}
