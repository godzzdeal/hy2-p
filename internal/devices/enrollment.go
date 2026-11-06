package devices

import (
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/security"
	"net/http"
	"time"
)

func (store *Store) Admit(user, password string, request *http.Request) (string, error) {
	hwid := request.Header.Get("x-hwid")
	store.mu.Lock()
	defer store.mu.Unlock()
	state := store.clone(user)
	if !model.HWIDPattern.MatchString(hwid) {
		if state.Limit > 0 {
			return "", model.ErrMissingHWID
		}
		return password, nil
	}
	id := security.Hash(store.vault.Prefix(user + "\x00" + hwid))[:32]
	entry, exists := state.Devices[id]
	if exists && entry.Blocked {
		return "", model.ErrBlocked
	}
	if !exists {
		if state.Limit > 0 && active(state) >= state.Limit {
			return "", model.ErrLimitReached
		}
		if len(state.Devices) >= model.MaxDevices {
			if state.Limit > 0 {
				return "", model.ErrRegistryFull
			}
			return password, nil
		}
	}
	parent := store.vault.Prefix(password)
	if !exists || entry.Parent != parent {
		secret := security.Token()
		encrypted, err := store.vault.Seal(secret)
		if err != nil {
			return "", err
		}
		entry.Password, entry.Digest, entry.Parent = encrypted, store.vault.Prefix(secret), parent
	}
	info := model.Information(request)
	if info.Model == "" {
		info.Model = entry.Model
	}
	if info.OS == "" {
		info.OS = entry.OS
	}
	if info.OSVersion == "" {
		info.OSVersion = entry.OSVersion
	}
	if info.App == "" {
		info.App = entry.App
	}
	info.ID = id
	info.FirstSeen = entry.FirstSeen
	if info.FirstSeen == "" {
		info.FirstSeen = time.Now().UTC().Format(time.RFC3339)
	}
	info.LastSeen = time.Now().UTC().Format(time.RFC3339)
	info.LastConnected, info.ConnectionIP, info.Core = entry.LastConnected, entry.ConnectionIP, entry.Core
	entry.Device = info
	state.Devices[id] = entry
	if err := store.commit(user, state); err != nil {
		return "", model.ErrUnavailable
	}
	return store.vault.OpenPassword(entry.Password)
}
func (store *Store) Resolve(password string) (model.Reference, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()
	reference, exists := store.keys[store.vault.Prefix(password)]
	if !exists {
		return model.Reference{}, false
	}
	entry := store.users[reference.User].Devices[reference.Device]
	return reference, !entry.Blocked
}
func (store *Store) Identity(value string) (model.Reference, bool) {
	parsed, ok := security.ParseIdentity(value)
	if !ok {
		return model.Reference{}, false
	}
	store.mu.RLock()
	defer store.mu.RUnlock()
	entry, exists := store.users[parsed.User].Devices[parsed.Device]
	if !exists || entry.Blocked || security.IdentityStamp(entry.Digest) != parsed.Version {
		return model.Reference{}, false
	}
	return model.Reference{User: parsed.User, Device: parsed.Device, Parent: entry.Parent, Version: parsed.Version}, true
}
func (store *Store) Connected(user, password, core, address string) {
	store.mu.Lock()
	defer store.mu.Unlock()
	reference, exists := store.keys[store.vault.Prefix(password)]
	if !exists || reference.User != user {
		return
	}
	state := store.users[user]
	entry := state.Devices[reference.Device]
	entry.LastConnected = time.Now().UTC().Format(time.RFC3339)
	entry.ConnectionIP = model.IP(address)
	entry.Core = core
	state.Devices[reference.Device] = entry
	store.users[user] = state
	store.dirty = true
}
func active(state model.User) int {
	count := 0
	for _, entry := range state.Devices {
		if !entry.Blocked {
			count++
		}
	}
	return count
}
