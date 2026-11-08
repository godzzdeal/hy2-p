package devices

import (
	"context"
	"errors"
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/records"
	"hy2-panel/internal/security"
	"maps"
	"time"
)

const MetadataFlushInterval = 5 * time.Second

func (store *Store) Sources(ids []string) {
	store.mu.Lock()
	defer store.mu.Unlock()
	alive := map[string]bool{}
	for _, id := range ids {
		alive[id] = true
		if _, exists := store.online[id]; !exists {
			store.online[id] = nil
			store.available[id] = false
		}
	}
	for id := range store.online {
		if !alive[id] {
			delete(store.online, id)
			delete(store.available, id)
		}
	}
	store.sampled = true
}
func (store *Store) Observe(core string, online map[string]int, available bool) {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.online[core], store.available[core] = maps.Clone(online), available
}

func (store *Store) Remove(user, id string) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	state := store.clone(user)
	if _, exists := state.Devices[id]; !exists {
		return errors.New("Устройство не найдено")
	}
	delete(state.Devices, id)
	if err := store.commit(user, state); err != nil {
		return err
	}
	store.clearOnline(user + "." + id)
	return nil
}

func (store *Store) SetLimit(user string, limit int) error {
	if limit < 0 || limit > model.MaxDevices {
		return errors.New("Лимит устройств: от 0 до 100")
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	state := store.clone(user)
	if limit > 0 && active(state) > limit {
		return errors.New("Сначала отключите лишние устройства в списке")
	}
	state.Limit = limit
	return store.commit(user, state)
}
func (store *Store) SetBlocked(user, id string, blocked bool) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	state := store.clone(user)
	entry, exists := state.Devices[id]
	if !exists {
		return errors.New("Устройство не найдено")
	}
	limit := store.effectiveLimit(user, state.Limit)
	if entry.Blocked && !blocked && limit > 0 && active(state) >= limit {
		return model.ErrLimitReached
	}
	entry.Blocked = blocked
	state.Devices[id] = entry
	if err := store.commit(user, state); err != nil {
		return err
	}
	if blocked {
		store.clearOnline(user + "." + id)
	}
	return nil
}
func (store *Store) effectiveLimit(user string, personal int) int {
	if store.GroupLimit == nil {
		return personal
	}
	group := store.GroupLimit(user)
	if group > 0 && (personal == 0 || group < personal) {
		return group
	}
	return personal
}
func (store *Store) permitted(user, id string, state model.User) bool {
	limit := store.effectiveLimit(user, state.Limit)
	if limit == 0 {
		return true
	}
	position := 0
	for current, entry := range state.Devices {
		if !entry.Blocked && current <= id {
			position++
		}
	}
	return position <= limit
}
func (store *Store) clearOnline(target string) {
	for _, online := range store.online {
		for id := range online {
			if security.MatchesIdentity(id, target) {
				delete(online, id)
			}
		}
	}
}
func (store *Store) Flush() error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if !store.dirty {
		return nil
	}
	if err := records.Write(store.directory, "devices", store.users); err != nil {
		return err
	}
	store.dirty = false
	return nil
}
func (store *Store) Run(ctx context.Context) {
	ticker := time.NewTicker(MetadataFlushInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			store.Flush()
			return
		case <-ticker.C:
			store.Flush()
		}
	}
}
