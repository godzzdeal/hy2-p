package traffic

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/traffic/sources"
	"io"
	"net/http"
	"time"
)

const MaxStatsPayload = 8 << 20

func (service *Service) read(ctx context.Context, path string, target any) error {
	request, err := http.NewRequestWithContext(ctx, "GET", service.address+path, nil)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", service.secret)
	response, err := service.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return errors.New("API статистики недоступен")
	}
	return json.NewDecoder(io.LimitReader(response.Body, MaxStatsPayload)).Decode(target)
}
func delta(current, previous uint64) uint64 {
	if current < previous {
		return current
	}
	return current - previous
}
func (service *Service) Collect(ctx context.Context) {
	if provider, ok := service.runtime.(interface{ TrafficSources() []sources.Source }); ok {
		service.collectSources(ctx, provider.TrafficSources())
		return
	}
	if !service.runtime.Running() {
		service.mu.Lock()
		for id, usage := range service.state.Users {
			usage.Online = 0
			service.state.Users[id] = usage
		}
		service.state.Available = true
		service.state.Error = ""
		service.mu.Unlock()
		return
	}
	generation := service.runtime.Generation()
	counters := map[string]Counter{}
	online := map[string]int{}
	err := service.read(ctx, "/traffic", &counters)
	if err == nil {
		err = service.read(ctx, "/online", &online)
	}
	if err != nil {
		service.mu.Lock()
		service.state.Available = false
		service.state.Error = err.Error()
		service.mu.Unlock()
		return
	}
	if generation != service.runtime.Generation() {
		return
	}
	service.mu.Lock()
	if generation != service.generation {
		service.generation = generation
		service.baseline = map[string]Counter{}
	}
	for id, usage := range service.state.Users {
		usage.Online = 0
		service.state.Users[id] = usage
	}
	for id, counter := range counters {
		service.addCounter(id, counter)
	}
	for id, count := range online {
		usage := service.state.Users[id]
		usage.Online = count
		if count > 0 {
			usage.LastSeen = time.Now().UTC().Format(time.RFC3339)
		}
		service.state.Users[id] = usage
	}
	service.state.Available = true
	service.state.Updated = time.Now().UTC().Format(time.RFC3339)
	service.state.Error = ""
	if err = records.Write(service.directory, "usage", service.state); err != nil {
		service.state.Error = "Не удалось сохранить трафик: " + err.Error()
	}
	service.mu.Unlock()
	service.enforceQuota()
}
func (service *Service) enforceQuota() {
	for id, usage := range service.Snapshot().Users {
		if usage.Online > 0 && usage.Limit > 0 && usage.Upload+usage.Download >= usage.Limit {
			service.runtime.Kick(id)
		}
	}
}
func (service *Service) collectSources(ctx context.Context, inputs []sources.Source) {
	result := service.multiple.Read(ctx, inputs)
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
func (service *Service) addCounter(id string, counter Counter) {
	usage := service.state.Users[id]
	previous := service.baseline[id]
	usage.Upload += delta(counter.TX, previous.TX)
	usage.Download += delta(counter.RX, previous.RX)
	service.state.Users[id] = usage
	service.baseline[id] = counter
}
