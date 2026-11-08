package devices

import (
	"errors"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/records"
	"hy2-panel/internal/security"
	"maps"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

type Store struct {
	mu         sync.RWMutex
	directory  string
	vault      *cryptovault.Vault
	users      map[string]model.User
	keys       map[string]model.Reference
	dirty      bool
	online     map[string]map[string]int
	available  map[string]bool
	sampled    bool
	GroupLimit func(string) int
}

func Open(data string, vault *cryptovault.Vault) (*Store, error) {
	store := &Store{directory: filepath.Join(data, "devices"), vault: vault, users: map[string]model.User{}, keys: map[string]model.Reference{}}
	store.online, store.available = map[string]map[string]int{}, map[string]bool{}
	err := records.Read(store.directory, "devices", &store.users)
	if os.IsNotExist(err) {
		return store, nil
	}
	if err != nil {
		return nil, err
	}
	if store.users == nil {
		return nil, errors.New("Повреждён список устройств")
	}
	for user, state := range store.users {
		if state.Limit < 0 || state.Limit > model.MaxDevices || len(state.Devices) > model.MaxDevices {
			return nil, errors.New("Повреждены настройки устройств")
		}
		for id, entry := range state.Devices {
			if !model.IDPattern.MatchString(id) || entry.ID != id || entry.Digest == "" || entry.Password == "" || entry.Parent == "" {
				return nil, errors.New("Повреждены данные устройства")
			}
			plain, err := vault.OpenPassword(entry.Password)
			if err != nil || vault.Prefix(plain) != entry.Digest {
				return nil, errors.New("Повреждён ключ устройства")
			}
			store.keys[entry.Digest] = model.Reference{User: user, Device: id, Parent: entry.Parent, Version: security.IdentityStamp(entry.Digest)}
		}
	}
	return store, nil
}
func (store *Store) Snapshot(user string) model.Summary {
	store.mu.RLock()
	defer store.mu.RUnlock()
	state := store.users[user]
	result := model.Summary{Limit: state.Limit, EffectiveLimit: store.effectiveLimit(user, state.Limit), Devices: []model.Device{}}
	counts, known := store.counts(user, state)
	for _, entry := range state.Devices {
		device := entry.Device
		device.Online, device.StatusAvailable = counts[device.ID], known
		result.Devices = append(result.Devices, device)
	}
	sort.Slice(result.Devices, func(first, second int) bool {
		if result.Devices[first].LastSeen == result.Devices[second].LastSeen {
			return result.Devices[first].ID < result.Devices[second].ID
		}
		return result.Devices[first].LastSeen > result.Devices[second].LastSeen
	})
	return result
}
func (store *Store) counts(user string, state model.User) (map[string]int, bool) {
	counts, known := map[string]int{}, store.sampled
	for source, online := range store.online {
		if !store.available[source] {
			known = false
			continue
		}
		for id, count := range online {
			parsed, ok := security.ParseIdentity(id)
			if !ok || parsed.User != user {
				continue
			}
			entry, exists := state.Devices[parsed.Device]
			if exists && !entry.Blocked && parsed.Version == security.IdentityStamp(entry.Digest) {
				counts[parsed.Device] += count
			}
		}
	}
	return counts, known
}
func (store *Store) Limit(user string) int {
	store.mu.RLock()
	defer store.mu.RUnlock()
	return store.effectiveLimit(user, store.users[user].Limit)
}
func (store *Store) clone(user string) model.User {
	state := store.users[user]
	state.Devices = maps.Clone(state.Devices)
	if state.Devices == nil {
		state.Devices = map[string]model.Entry{}
	}
	return state
}
func (store *Store) commit(user string, state model.User) error {
	next := maps.Clone(store.users)
	next[user] = state
	if err := records.Write(store.directory, "devices", next); err != nil {
		return err
	}
	store.users = next
	store.dirty = false
	for digest, reference := range store.keys {
		if reference.User == user {
			delete(store.keys, digest)
		}
	}
	for id, entry := range state.Devices {
		store.keys[entry.Digest] = model.Reference{User: user, Device: id, Parent: entry.Parent, Version: security.IdentityStamp(entry.Digest)}
	}
	return nil
}
