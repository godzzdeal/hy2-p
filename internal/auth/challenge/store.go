package challenge

import (
	"hy2-panel/internal/security"
	"sync"
	"time"
)

type Store struct {
	mu        sync.Mutex
	entries   map[string]entry
	cleanupAt time.Time
}

func New() *Store { return &Store{entries: make(map[string]entry)} }

func (store *Store) Issue(ip string, epoch uint64, now time.Time) (string, bool) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if !now.Before(store.cleanupAt) {
		for key, value := range store.entries {
			if !now.Before(value.expires) {
				delete(store.entries, key)
			}
		}
		store.cleanupAt = now.Add(time.Minute)
	}
	if len(store.entries) >= Capacity {
		return "", false
	}
	token := security.Token()
	store.entries[security.Hash(token)] = entry{ip: ip, epoch: epoch, expires: now.Add(Lifetime)}
	return token, true
}

func (store *Store) Begin(token, ip string, now time.Time) (uint64, bool) {
	store.mu.Lock()
	defer store.mu.Unlock()
	key := security.Hash(token)
	value, exists := store.entries[key]
	if !exists || value.ip != ip {
		return 0, false
	}
	if !now.Before(value.expires) || value.attempts >= MaxAttempts {
		delete(store.entries, key)
		return 0, false
	}
	value.attempts++
	store.entries[key] = value
	return value.epoch, true
}

func (store *Store) Consume(token, ip string, now time.Time) bool {
	store.mu.Lock()
	defer store.mu.Unlock()
	key := security.Hash(token)
	value, exists := store.entries[key]
	if !exists || value.ip != ip || !now.Before(value.expires) {
		return false
	}
	delete(store.entries, key)
	return true
}

func (store *Store) Clear() {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.entries = make(map[string]entry)
}
