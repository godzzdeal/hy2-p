package systemmetrics

import (
	"context"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/systemmetrics/proc"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"sync"
	"time"
)

func New(options Options) *Service {
	if options.Proc == "" {
		options.Proc = "/proc"
	}
	if options.Scope == "" {
		options.Scope = "host"
		if os.Getenv("PANEL_CONTAINER") == "true" {
			options.Scope = "container"
		}
	}
	service := &Service{options: options, snapshot: Snapshot{Scope: options.Scope, Samples: []Sample{}}}
	service.sample()
	return service
}
func (service *Service) Run(ctx context.Context) {
	var workers sync.WaitGroup
	workers.Go(func() { service.storageLoop(ctx) })
	defer workers.Wait()
	ticker := time.NewTicker(SampleInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			service.sample()
		}
	}
}
func (service *Service) Snapshot() Snapshot {
	service.mu.RLock()
	defer service.mu.RUnlock()
	result := service.snapshot
	result.Samples = append([]Sample{}, result.Samples...)
	return result
}
func (service *Service) Read(writer http.ResponseWriter, request *http.Request) {
	if os.Getenv("PANEL_CONTAINER") == "true" && service.options.Root == "" {
		result, err := protocol.Exchange[Snapshot](request.Context(), http.MethodGet, protocol.SystemPath, nil)
		if err == nil {
			transport.Respond(writer, result)
			return
		}
	}
	transport.Respond(writer, service.Snapshot())
}
func (service *Service) sample() {
	value, err := proc.Read(service.options.Proc)
	service.mu.Lock()
	defer service.mu.Unlock()
	if err != nil {
		service.snapshot.Available = false
		service.snapshot.Error = "Системные показатели доступны на Linux"
		return
	}
	now := time.Now()
	next := Sample{Time: now.UnixMilli(), Load: value.Load, Memory: float64(value.MemoryUsed) / float64(value.MemoryTotal) * 100}
	previous := service.previous
	seconds := now.Sub(previous.at).Seconds()
	if !previous.at.IsZero() && value.Total > previous.total && value.Idle >= previous.idle {
		total := value.Total - previous.total
		idle := value.Idle - previous.idle
		if idle <= total {
			next.CPU = float64(total-idle) / float64(total) * 100
		}
	}
	if !previous.at.IsZero() && seconds > 0 && value.Received >= previous.received && value.Transmitted >= previous.transmitted {
		next.Receive = float64(value.Received-previous.received) / seconds
		next.Transmit = float64(value.Transmitted-previous.transmitted) / seconds
	}
	service.previous = counters{total: value.Total, idle: value.Idle, received: value.Received, transmitted: value.Transmitted, at: now}
	service.snapshot.Available = true
	service.snapshot.Error = ""
	service.snapshot.CPUs = value.CPUs
	service.snapshot.Uptime = value.Uptime
	service.snapshot.MemoryTotal = value.MemoryTotal
	service.snapshot.MemoryUsed = value.MemoryUsed
	service.snapshot.Received = value.Received
	service.snapshot.Transmitted = value.Transmitted
	service.snapshot.Samples = append(service.snapshot.Samples, next)
	if len(service.snapshot.Samples) > HistorySize {
		copy(service.snapshot.Samples, service.snapshot.Samples[len(service.snapshot.Samples)-HistorySize:])
		service.snapshot.Samples = service.snapshot.Samples[:HistorySize]
	}
}
