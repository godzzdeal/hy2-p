package update

import (
	"context"
	"errors"
	"hy2-panel/internal/releases"
	"sync"
	"time"
)

const OperationTimeout = 3 * time.Minute
const ProbeTimeout = 5 * time.Second

type Entry struct {
	Path    string `json:"path"`
	Version string `json:"version"`
	Digest  string `json:"digest"`
}
type Result struct {
	Phase   string `json:"phase"`
	Message string `json:"message"`
	Target  string `json:"target"`
	Started string `json:"started"`
}
type State struct {
	Current  Entry  `json:"current"`
	Previous *Entry `json:"previous,omitempty"`
	Pending  *Entry `json:"pending,omitempty"`
	Last     Result `json:"last"`
}
type Status struct {
	Current           string `json:"current"`
	Previous          string `json:"previous"`
	Busy              bool   `json:"busy"`
	RollbackAvailable bool   `json:"rollbackAvailable"`
	Result            Result `json:"result"`
}
type Runtime interface {
	TryLock() bool
	Unlock()
	Running() bool
	Activate(context.Context, string, bool) error
	Probe(context.Context, string) (string, error)
}
type Service struct {
	mu        sync.Mutex
	state     State
	busy      bool
	directory string
	runtime   Runtime
	source    releases.Source
}

func (service *Service) Current() Entry {
	service.mu.Lock()
	defer service.mu.Unlock()
	return service.state.Current
}
func (service *Service) Snapshot() Status {
	service.mu.Lock()
	defer service.mu.Unlock()
	previous := ""
	if service.state.Previous != nil {
		previous = service.state.Previous.Version
	}
	return Status{service.state.Current.Version, previous, service.busy, service.state.Previous != nil, service.state.Last}
}
func (service *Service) Versions(ctx context.Context) ([]releases.Version, error) {
	return service.source.List(ctx)
}
func (service *Service) progress(phase, message string) {
	service.mu.Lock()
	defer service.mu.Unlock()
	service.state.Last.Phase = phase
	service.state.Last.Message = message
}

func (service *Service) RecoverLocked(ctx context.Context) error {
	// The watchdog holds the runtime operation lock for the entire recovery.
	service.mu.Lock()
	original := service.state
	if original.Previous == nil {
		service.mu.Unlock()
		return errors.New("нет предыдущего исправного экземпляра для отката")
	}
	service.busy = true
	original.Last = Result{Phase: "rolling_back", Message: "Watchdog: перезапуски не помогли, восстанавливаем предыдущий экземпляр", Target: original.Previous.Version, Started: time.Now().UTC().Format(time.RFC3339)}
	service.mu.Unlock()
	defer func() { service.mu.Lock(); service.busy = false; service.mu.Unlock() }()
	candidate, err := service.prepare(ctx, "", true, original)
	if err != nil {
		service.finishError(original, err)
		return err
	}
	pending := original
	pending.Pending = &candidate
	if err = service.commit(pending); err != nil {
		service.finishError(original, err)
		return err
	}
	if err = service.runtime.Activate(ctx, candidate.Path, true); err != nil {
		// A timed-out health check can leave the candidate running. Restore the
		// recorded binary selection without starting the already rejected version.
		cleanup, cancel := context.WithTimeout(context.WithoutCancel(ctx), OperationTimeout)
		err = errors.Join(err, service.runtime.Activate(cleanup, original.Current.Path, false))
		cancel()
		service.finishError(original, err)
		return err
	}
	next := State{Current: candidate, Last: original.Last}
	next.Last.Phase = "success"
	next.Last.Message = "Watchdog восстановил предыдущий экземпляр после неудачных перезапусков"
	if err = service.commit(next); err != nil {
		service.progress("failed", "Экземпляр запущен, но состояние отката не сохранено: "+err.Error())
		return err
	}
	return nil
}
