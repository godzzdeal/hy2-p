package groups

import (
	"errors"
	"slices"
)

func (store *Store) Remove(id string) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	next := clone(store.state)
	index := slices.IndexFunc(next.Groups, func(group Group) bool { return group.ID == id })
	if index < 0 {
		return errors.New("Группа не найдена")
	}
	next.Groups = slices.Delete(next.Groups, index, index+1)
	for user, group := range next.Memberships {
		if group == id {
			delete(next.Memberships, user)
		}
	}
	return store.commit(next)
}

func (store *Store) ForUser(user string) (Group, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()
	id := store.state.Memberships[user]
	for _, group := range store.state.Groups {
		if group.ID == id {
			group.Access.Instances = append([]string{}, group.Access.Instances...)
			return group, true
		}
	}
	return Group{}, false
}
func (store *Store) Allows(user, instance string) bool {
	group, exists := store.ForUser(user)
	return !exists || group.Access.Allows(instance)
}
func (store *Store) TrafficLimit(user string) uint64 {
	group, _ := store.ForUser(user)
	return group.TrafficLimit
}
func (store *Store) DeviceLimit(user string) int {
	group, _ := store.ForUser(user)
	return group.DeviceLimit
}
