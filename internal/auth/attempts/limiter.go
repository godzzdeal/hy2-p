package attempts

import (
	"sync"
	"time"
)

type Limiter struct {
	mu        sync.Mutex
	addresses map[string]history
	cleanupAt time.Time
}

func New() *Limiter {
	return &Limiter{addresses: make(map[string]history)}
}

func (limiter *Limiter) Allow(address string, now time.Time) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()
	if !now.Before(limiter.cleanupAt) {
		for key, entry := range limiter.addresses {
			if !entry.hasRecent(now) {
				delete(limiter.addresses, key)
			}
		}
		limiter.cleanupAt = now.Add(attemptWindow)
	}
	entry, exists := limiter.addresses[address]
	if !exists && len(limiter.addresses) >= maxAddresses {
		return false
	}
	recent := history{}
	for index := 0; index < entry.count; index++ {
		if now.Sub(entry.timestamps[index]) < attemptWindow {
			recent.timestamps[recent.count] = entry.timestamps[index]
			recent.count++
		}
	}
	if recent.count == maxAttempts {
		return false
	}
	recent.timestamps[recent.count] = now
	recent.count++
	limiter.addresses[address] = recent
	return true
}
