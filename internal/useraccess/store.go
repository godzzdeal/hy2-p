package useraccess

import (
	"errors"
	"hy2-panel/internal/records"
	"maps"
	"os"
	"path/filepath"
	"regexp"
	"slices"
)

var userIDPattern = regexp.MustCompile("^[a-f0-9]{16}$")

func Open(data string) (*Store, error) {
	store := &Store{directory: filepath.Join(data, "user-access"), policies: map[string]Policy{}}
	err := records.Read(store.directory, "permissions", &store.policies)
	if os.IsNotExist(err) {
		return store, nil
	}
	if err != nil {
		return nil, err
	}
	if store.policies == nil {
		return nil, errors.New("Повреждены права доступа пользователей")
	}
	for id, policy := range store.policies {
		if !userIDPattern.MatchString(id) || policy.Validate() != nil {
			return nil, errors.New("Повреждены права доступа пользователей")
		}
	}
	return store, nil
}
func (store *Store) Get(id string) Policy {
	store.mu.RLock()
	defer store.mu.RUnlock()
	policy, exists := store.policies[id]
	if !exists {
		return Default()
	}
	policy.Instances = slices.Clone(policy.Instances)
	return policy
}
func (store *Store) Allows(user, instance string) bool {
	return store.Get(user).Allows(instance)
}
func (store *Store) Put(id string, policy Policy) error {
	if !userIDPattern.MatchString(id) {
		return errors.New("Некорректный пользователь")
	}
	if err := policy.Validate(); err != nil {
		return err
	}
	policy.Instances = append([]string{}, policy.Instances...)
	store.mu.Lock()
	defer store.mu.Unlock()
	next := maps.Clone(store.policies)
	next[id] = policy
	if err := records.Write(store.directory, "permissions", next); err != nil {
		return err
	}
	store.policies = next
	return nil
}
