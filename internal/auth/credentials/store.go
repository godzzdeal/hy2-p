package credentials

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/records"
	"os"
	"strings"
	"sync"
	"unicode"
)

type Value struct {
	Username  string `json:"username"`
	Hash      []byte `json:"hash"`
	CloudHash []byte `json:"cloudHash,omitempty"`
}
type Store struct {
	mu        sync.RWMutex
	value     Value
	directory string
}

func New(username string, hash []byte, directory string) (*Store, error) {
	store := &Store{value: Value{Username: username, Hash: hash}, directory: directory}
	if directory != "" {
		err := records.Read(directory, "credentials", &store.value)
		if err != nil && !os.IsNotExist(err) {
			return nil, err
		}
	}
	if store.value.Username == "" {
		return nil, errors.New("пустой логин администратора")
	}
	if _, err := bcrypt.Cost(store.value.Hash); err != nil {
		return nil, err
	}
	if len(store.value.CloudHash) > 0 {
		if _, err := bcrypt.Cost(store.value.CloudHash); err != nil {
			return nil, err
		}
	}
	return store, nil
}
func (store *Store) Username() string {
	store.mu.RLock()
	defer store.mu.RUnlock()
	return store.value.Username
}
func (store *Store) Verify(username, password string) bool {
	store.mu.RLock()
	value := store.value
	store.mu.RUnlock()
	matches := bcrypt.CompareHashAndPassword(value.Hash, []byte(password)) == nil
	return matches && username == value.Username
}
func (store *Store) Change(currentPassword, username, password string) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if bcrypt.CompareHashAndPassword(store.value.Hash, []byte(currentPassword)) != nil {
		return errors.New("текущий пароль неверен")
	}
	username = strings.TrimSpace(username)
	if len(username) < 3 || len(username) > 64 || strings.IndexFunc(username, unicode.IsSpace) >= 0 {
		return errors.New("логин: от 3 до 64 символов без пробелов")
	}
	next := Value{Username: username, Hash: store.value.Hash, CloudHash: store.value.CloudHash}
	if password != "" {
		if len(password) < MinAdminPassword || len(password) > MaxPasswordBytes {
			return errors.New("пароль: от 16 до 72 байт")
		}
		if len(store.value.CloudHash) > 0 && bcrypt.CompareHashAndPassword(store.value.CloudHash, []byte(password)) == nil {
			return errors.New("основной пароль должен отличаться от облачного")
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		next.Hash = hash
	}
	if store.directory != "" {
		if err := records.Write(store.directory, "credentials", next); err != nil {
			return err
		}
	}
	store.value = next
	return nil
}
