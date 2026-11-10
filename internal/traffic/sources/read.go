package sources

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
)

func (collector *Collector) read(ctx context.Context, source Source, path string, target any) error {
	request, err := http.NewRequestWithContext(ctx, "GET", source.Address+path, nil)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", source.Secret)
	response, err := collector.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return fmt.Errorf("stats %s: HTTP %d", source.ID, response.StatusCode)
	}
	return json.NewDecoder(io.LimitReader(response.Body, MaxPayload)).Decode(target)
}
func (collector *Collector) sample(ctx context.Context, source Source) Sample {
	sample := Sample{Source: source, Generation: source.Runtime.Generation(), Counters: map[string]Counter{}, Online: map[string]int{}}
	sample.Err = collector.read(ctx, source, "/traffic", &sample.Counters)
	if sample.Err == nil {
		sample.Err = collector.read(ctx, source, "/online", &sample.Online)
	}
	if sample.Generation != source.Runtime.Generation() {
		sample.Err = fmt.Errorf("экземпляр %s перезапускается", source.ID)
	}
	return sample
}
func (collector *Collector) Read(ctx context.Context, sources []Source) Result {
	samples := make([]Sample, len(sources))
	var workers sync.WaitGroup
	for index, source := range sources {
		if !source.Runtime.Running() {
			continue
		}
		workers.Add(1)
		go func(index int, source Source) {
			defer workers.Done()
			samples[index] = collector.sample(ctx, source)
		}(index, source)
	}
	workers.Wait()
	return collector.merge(samples, sources)
}
