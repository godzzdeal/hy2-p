package traffic

import (
	"context"
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const PollInterval = 5 * time.Second
const RequestTimeout = 2 * time.Second

type Counter struct {
	TX uint64 `json:"tx"`
	RX uint64 `json:"rx"`
}
type Usage struct {
	Upload   uint64 `json:"upload"`
	Download uint64 `json:"download"`
	Limit    uint64 `json:"limit"`
	Online   int    `json:"online"`
	LastSeen string `json:"lastSeen"`
}
type Snapshot struct {
	Users     map[string]Usage `json:"users"`
	Available bool             `json:"available"`
	Updated   string           `json:"updated"`
	Error     string           `json:"error"`
}
type Runtime interface {
	Running() bool
	Generation() string
	Kick(string)
}
type Service struct {
	mu                                     sync.Mutex
	state                                  Snapshot
	baseline                               map[string]Counter
	generation, directory, secret, address string
	runtime                                Runtime
	client                                 *http.Client
}

func New(data, secret string, runtime Runtime) (*Service, error) {
	service := &Service{directory: filepath.Join(data, "traffic"), secret: secret, address: "http://127.0.0.1:9999", runtime: runtime, client: &http.Client{Timeout: RequestTimeout}, baseline: map[string]Counter{}}
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
		snapshot.Users[id] = usage
	}
	return snapshot
}
func (service *Service) Allowed(id string) bool {
	service.mu.Lock()
	defer service.mu.Unlock()
	usage := service.state.Users[id]
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

const MaxSafeBytes = uint64(9007199254740991)

func (service *Service) Read(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, service.Snapshot())
}
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
	service.mu.Lock()
	previous, existed := service.state.Users[id]
	next := previous
	if input.Upload != nil {
		next.Upload = *input.Upload
	}
	if input.Download != nil {
		next.Download = *input.Download
	}
	next.Limit = input.Limit
	if next.Upload > MaxSafeBytes || next.Download > MaxSafeBytes || next.Limit > MaxSafeBytes || next.Upload > MaxSafeBytes-next.Download {
		service.mu.Unlock()
		transport.Fail(writer, errors.New("слишком большое значение трафика"), 400)
		return
	}
	service.state.Users[id] = next
	err := records.Write(service.directory, "usage", service.state)
	if err != nil {
		if existed {
			service.state.Users[id] = previous
		} else {
			delete(service.state.Users, id)
		}
	}
	service.mu.Unlock()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	if !service.Allowed(id) {
		service.runtime.Kick(id)
	}
	transport.Respond(writer, next)
}
