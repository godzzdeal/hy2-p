package groups

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
