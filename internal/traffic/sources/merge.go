package sources

import "errors"

func delta(current, previous uint64) uint64 {
	if current < previous {
		return current
	}
	return current - previous
}
func (collector *Collector) merge(samples []Sample) Result {
	collector.mu.Lock()
	defer collector.mu.Unlock()
	result := Result{Counters: map[string]Counter{}, Online: map[string]int{}}
	for _, sample := range samples {
		if sample.Source.Runtime == nil {
			continue
		}
		if sample.Err != nil {
			result.Err = errors.Join(result.Err, sample.Err)
			continue
		}
		id := sample.Source.ID
		if collector.generations[id] != sample.Generation || collector.baselines[id] == nil {
			collector.generations[id] = sample.Generation
			collector.baselines[id] = map[string]Counter{}
		}
		for user, current := range sample.Counters {
			previous := collector.baselines[id][user]
			total := result.Counters[user]
			total.TX += delta(current.TX, previous.TX)
			total.RX += delta(current.RX, previous.RX)
			result.Counters[user] = total
			collector.baselines[id][user] = current
		}
		for user, count := range sample.Online {
			result.Online[user] += count
		}
	}
	return result
}
