package traffic

import (
	"context"
	"hy2-panel/internal/records"
	"hy2-panel/internal/traffic/sources"
	"time"
)

type Runtime interface {
	Kick(string)
	TrafficSources() []sources.Source
}

func (service *Service) Collect(ctx context.Context) {
	result := service.multiple.Read(ctx, service.runtime.TrafficSources())
	service.mu.Lock()
	for id, usage := range service.state.Users {
		usage.Online = 0
		service.state.Users[id] = usage
	}
	for id, counter := range result.Counters {
		usage := service.state.Users[id]
		usage.Upload += counter.TX
		usage.Download += counter.RX
		service.state.Users[id] = usage
	}
	for id, count := range result.Online {
		usage := service.state.Users[id]
		usage.Online = count
		if count > 0 {
			usage.LastSeen = time.Now().UTC().Format(time.RFC3339)
		}
		service.state.Users[id] = usage
	}
	service.state.Available = result.Err == nil
	service.state.Error = ""
	if result.Err != nil {
		service.state.Error = result.Err.Error()
	}
	service.state.Updated = time.Now().UTC().Format(time.RFC3339)
	if err := records.Write(service.directory, "usage", service.state); err != nil {
		service.state.Error = err.Error()
	}
	service.mu.Unlock()
	service.enforceQuota()
}
func (service *Service) enforceQuota() {
	for id, usage := range service.Snapshot().Users {
		if usage.Online > 0 && !service.Allowed(id) {
			service.runtime.Kick(id)
		}
	}
}
