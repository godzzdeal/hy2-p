package credentials

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/records"
	"os"
)

const MinCloudPassword = 12

func (store *Store) HasCloudPassword() bool {
	store.mu.RLock()
	defer store.mu.RUnlock()
	return len(store.value.CloudHash) > 0
}

func (store *Store) VerifyCloud(password string) bool {
	store.mu.RLock()
	hash := append([]byte{}, store.value.CloudHash...)
	store.mu.RUnlock()
	return len(hash) > 0 && bcrypt.CompareHashAndPassword(hash, []byte(password)) == nil
}

func (store *Store) ChangeCloud(current, password string) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if len(store.value.CloudHash) > 0 && bcrypt.CompareHashAndPassword(store.value.CloudHash, []byte(current)) != nil {
		return errors.New("Неверный облачный пароль")
	}
	next := store.value
	next.CloudHash = nil
	if password != "" {
		if len(password) < MinCloudPassword || len(password) > 72 {
			return errors.New("Облачный пароль: от 12 до 72 байт")
		}
		if bcrypt.CompareHashAndPassword(store.value.Hash, []byte(password)) == nil {
			return errors.New("Облачный пароль должен отличаться от основного")
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		next.CloudHash = hash
	}
	if store.directory != "" {
		if err := records.Write(store.directory, "credentials", next); err != nil {
			return err
		}
	}
	store.value = next
	return nil
}

func ResetCloud(directory string) error {
	var value Value
	if err := records.Read(directory, "credentials", &value); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if _, err := bcrypt.Cost(value.Hash); err != nil {
		return err
	}
	value.CloudHash = nil
	return records.Write(directory, "credentials", value)
}
