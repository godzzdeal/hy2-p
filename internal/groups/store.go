package groups

import (
	"errors"
	"hy2-panel/internal/records"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
)

type Store struct {
	mu        sync.RWMutex
	directory string
	state     Snapshot
}

func Open(data string) (*Store, error) {
	store := &Store{directory: filepath.Join(data, "groups"), state: Snapshot{Groups: []Group{}, Memberships: map[string]string{}}}
	err := records.Read(store.directory, "groups", &store.state)
	if os.IsNotExist(err) {
		return store, nil
	}
	if err != nil {
		return nil, err
	}
	if len(store.state.Groups) > MaxGroups || store.state.Memberships == nil {
		return nil, errors.New("Повреждены группы пользователей")
	}
	seen := map[string]bool{}
	for _, group := range store.state.Groups {
		if group.Validate() != nil || seen[group.ID] {
			return nil, errors.New("Повреждены группы пользователей")
		}
		seen[group.ID] = true
	}
	for user, group := range store.state.Memberships {
		if !IDPattern.MatchString(user) || !seen[group] {
			return nil, errors.New("Повреждены участники групп")
		}
	}
	return store, nil
}
func (store *Store) Snapshot() Snapshot {
	store.mu.RLock()
	defer store.mu.RUnlock()
	return clone(store.state)
}
func clone(state Snapshot) Snapshot {
	state.Groups = slices.Clone(state.Groups)
	for index := range state.Groups {
		state.Groups[index].Access.Instances = slices.Clone(state.Groups[index].Access.Instances)
	}
	state.Memberships = maps.Clone(state.Memberships)
	return state
}
func (store *Store) Put(group Group) error {
	group.Access.Instances = slices.Clone(group.Access.Instances)
	group.Name = strings.TrimSpace(group.Name)
	if err := group.Validate(); err != nil {
		return err
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	next := clone(store.state)
	index := slices.IndexFunc(next.Groups, func(current Group) bool { return current.ID == group.ID })
	for _, current := range next.Groups {
		if current.ID != group.ID && strings.EqualFold(current.Name, group.Name) {
			return errors.New("Группа с таким именем уже существует")
		}
	}
	if index < 0 {
		if len(next.Groups) >= MaxGroups {
			return errors.New("Достигнут предел: 64 группы")
		}
		next.Groups = append(next.Groups, group)
	} else {
		next.Groups[index] = group
	}
	return store.commit(next)
}
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
func (store *Store) Assign(user, id string) error {
	if !IDPattern.MatchString(user) {
		return errors.New("Некорректный пользователь")
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	next := clone(store.state)
	if id == "" {
		delete(next.Memberships, user)
	} else {
		if !slices.ContainsFunc(next.Groups, func(group Group) bool { return group.ID == id }) {
			return errors.New("Группа не найдена")
		}
		next.Memberships[user] = id
	}
	return store.commit(next)
}
func (store *Store) commit(next Snapshot) error {
	if err := records.Write(store.directory, "groups", next); err != nil {
		return err
	}
	store.state = next
	return nil
}
