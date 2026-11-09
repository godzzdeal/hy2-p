package traffic

import (
	"context"
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/traffic/sources"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const PollInterval = 5 * time.Second
const RequestTimeout = 2 * time.Second
const MaxSafeBytes = uint64(9007199254740991)

type (
	Counter  = sources.Counter
	Usage    = sources.Usage
	Snapshot = sources.Snapshot
)

type Runtime = sources.ManagedRuntime
type Service struct {
	GroupLimit                             func(string) uint64
	mu                                     sync.Mutex
	state                                  Snapshot
	baseline                               map[string]Counter
	generation, directory, secret, address string
	runtime                                Runtime
	client                                 *http.Client
	multiple                               *sources.Collector
}

func New(data, secret string, runtime Runtime) (*Service, error) {
	service := &Service{directory: filepath.Join(data, "traffic"), secret: secret, address: "http://127.0.0.1:9999", runtime: runtime, client: &http.Client{Timeout: RequestTimeout}, baseline: map[string]Counter{}}
	service.multiple = sources.New(service.client)
	err := records.Read(service.directory, "usage", &service.state)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if service.state.Users == nil {
		service.state.Users = map[string]Usage{}
	}
	for id, usage := range service.state.Users {
		usage.Online = 0
		service.state.Users[id] = usage
	}
	service.state.Available = false
	return service, nil
}
func (service *Service) Snapshot() Snapshot {
	service.mu.Lock()
	defer service.mu.Unlock()
	snapshot := service.state
	snapshot.Users = make(map[string]Usage, len(service.state.Users))
	for id, usage := range service.state.Users {
		if service.GroupLimit != nil {
			usage.GroupLimit = service.GroupLimit(id)
		}
		snapshot.Users[id] = usage
	}
	return snapshot
}
func (service *Service) Allowed(id string) bool {
	service.mu.Lock()
	defer service.mu.Unlock()
	usage := service.state.Users[id]
	if service.GroupLimit != nil {
		group := service.GroupLimit(id)
		if group > 0 && (usage.Limit == 0 || group < usage.Limit) {
			usage.Limit = group
		}
	}
	return usage.Limit == 0 || usage.Upload+usage.Download < usage.Limit
}
func (service *Service) Run(ctx context.Context) {
	ticker := time.NewTicker(PollInterval)
	defer ticker.Stop()
	for {
		service.Collect(ctx)
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

var errUsage = errors.New("слишком большое значение трафика")

func (service *Service) Adjust(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Upload   *uint64 `json:"upload"`
		Download *uint64 `json:"download"`
		Limit    uint64  `json:"limit"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	id := request.PathValue("id")
	err := service.setUsage(id, func(next Usage) Usage {
		if input.Upload != nil {
			next.Upload = *input.Upload
		}
		if input.Download != nil {
			next.Download = *input.Download
		}
		next.Limit = input.Limit
		return next
	})
	if err != nil {
		status := 500
		if errors.Is(err, errUsage) {
			status = 400
		}
		transport.Fail(writer, err, status)
		return
	}
	if !service.Allowed(id) {
		service.runtime.Kick(id)
	}
	transport.Respond(writer, service.Snapshot().Users[id])
}
func (service *Service) ImportUsage(id string, usage Usage) error {
	return service.setUsage(id, func(previous Usage) Usage { usage.Online, usage.GroupLimit = previous.Online, 0; return usage })
}
func (service *Service) setUsage(id string, change func(Usage) Usage) error {
	service.mu.Lock()
	defer service.mu.Unlock()
	previous, exists := service.state.Users[id]
	next := change(previous)
	if next.Upload > MaxSafeBytes || next.Download > MaxSafeBytes-next.Upload || next.Limit > MaxSafeBytes {
		return errUsage
	}
	service.state.Users[id] = next
	if err := records.Write(service.directory, "usage", service.state); err != nil {
		if exists {
			service.state.Users[id] = previous
		} else {
			delete(service.state.Users, id)
		}
		return err
	}
	return nil
}
