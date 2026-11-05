package update

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"hy2-panel/internal/releases"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func New(directory, bundled string, runtime Runtime, source releases.Source) (*Service, error) {
	service := &Service{directory: filepath.Join(directory, "core"), runtime: runtime, source: source}
	if err := os.MkdirAll(service.directory, 0700); err != nil {
		return nil, err
	}
	statePath, err := service.latest()
	if err != nil {
		return nil, err
	}
	payload, err := os.ReadFile(statePath)
	if err == nil {
		if err = json.Unmarshal(payload, &service.state); err != nil {
			return nil, err
		}
		if service.state.Current.Path == "" {
			return nil, errors.New("повреждено состояние ядра")
		}
		if service.state.Pending != nil {
			service.state.Pending = nil
			service.state.Last.Phase = "rolled_back"
			service.state.Last.Message = "Незавершённое обновление отменено. Выбрано предыдущее подтверждённое ядро."
			if err = service.persist(service.state); err != nil {
				return nil, err
			}
		}
	} else if os.IsNotExist(err) {
		ctx, cancel := context.WithTimeout(context.Background(), ProbeTimeout)
		defer cancel()
		version, _ := runtime.Probe(ctx, bundled)
		if version == "" {
			version = "Не установлено"
		}
		service.state = State{Current: Entry{Path: bundled, Version: version}, Last: Result{Phase: "idle"}}
	} else {
		return nil, err
	}
	return service, nil
}
func (service *Service) latest() (string, error) {
	entries, err := os.ReadDir(service.directory)
	if err != nil {
		return "", err
	}
	latest := filepath.Join(service.directory, "state.json")
	for _, entry := range entries {
		name := entry.Name()
		if !strings.HasPrefix(name, "state-") || !strings.HasSuffix(name, ".json") {
			continue
		}
		revision, err := strconv.ParseUint(strings.TrimSuffix(strings.TrimPrefix(name, "state-"), ".json"), 10, 64)
		if err == nil && revision > service.revision {
			service.revision = revision
			latest = filepath.Join(service.directory, name)
		}
	}
	return latest, nil
}
func (service *Service) persist(state State) error {
	payload, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	temporary, err := os.CreateTemp(service.directory, "journal-tmp-")
	if err != nil {
		return err
	}
	defer os.Remove(temporary.Name())
	defer temporary.Close()
	if err = temporary.Chmod(0600); err != nil {
		return err
	}
	if _, err = temporary.Write(payload); err != nil {
		return err
	}
	if err = temporary.Sync(); err != nil {
		return err
	}
	if err = temporary.Close(); err != nil {
		return err
	}
	// Publish a new immutable record. A crash leaves either the previous record or the complete next one.
	revision := service.revision + 1
	destination := filepath.Join(service.directory, fmt.Sprintf("state-%020d.json", revision))
	if err = os.Rename(temporary.Name(), destination); err != nil {
		return err
	}
	service.revision = revision
	return nil
}
func (service *Service) commit(state State) error {
	if err := service.persist(state); err != nil {
		return err
	}
	service.mu.Lock()
	service.state = state
	service.mu.Unlock()
	return nil
}
