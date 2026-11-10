package update

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/releases"
	"os"
	"path/filepath"
)

func New(directory, bundled string, runtime Runtime, source releases.Source) (*Service, error) {
	service := &Service{directory: filepath.Join(directory, "core"), runtime: runtime, source: source}
	if err := os.MkdirAll(service.directory, 0700); err != nil {
		return nil, err
	}
	err := service.read()
	if err == nil {
		if service.state.Current.Path == "" {
			return nil, errors.New("повреждено состояние экземпляра")
		}
		if service.state.Pending != nil {
			service.state.Pending = nil
			service.state.Last.Phase = "rolled_back"
			service.state.Last.Message = "Незавершённое обновление отменено. Выбран предыдущий проверенный экземпляр."
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
func (service *Service) read() error {
	if err := records.Read(service.directory, "state", &service.state); !os.IsNotExist(err) {
		return err
	}
	// Legacy installations have one state.json; revisions take precedence once written.
	payload, err := os.ReadFile(filepath.Join(service.directory, "state.json"))
	if err != nil {
		return err
	}
	return json.Unmarshal(payload, &service.state)
}
func (service *Service) persist(state State) error {
	return records.Write(service.directory, "state", state)
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
