package profiles

import (
	"encoding/json"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func (store *Store) Get() (Settings, error) {
	var revision Revision
	err := records.Read(store.Directory, "configuration", &revision)
	if err == nil {
		revision.Settings, err = store.open(revision.Settings)
	}
	return revision.Settings, err
}
func (store *Store) open(settings Settings) (Settings, error) {
	if store.Vault == nil {
		return settings, nil
	}
	var err error
	settings.Config, err = store.Vault.OpenPassword(settings.Config)
	return settings, err
}
func (store *Store) Put(settings Settings) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if store.Vault != nil {
		encrypted, err := store.Vault.Seal(settings.Config)
		if err != nil {
			return err
		}
		settings.Config = encrypted
	}
	id := time.Now().UnixMilli()
	var previous Revision
	if err := records.Read(store.Directory, "configuration", &previous); err == nil && previous.ID >= id {
		id = previous.ID + 1
	}
	return records.Write(store.Directory, "configuration", Revision{
		ID: id, Created: time.Now().UTC().Format(time.RFC3339), Settings: settings,
	})
}
func (store *Store) History() ([]Revision, error) {
	entries, err := os.ReadDir(store.Directory)
	if err != nil {
		return nil, err
	}
	result := []Revision{}
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), "configuration-") || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(store.Directory, entry.Name()))
		if err != nil {
			return nil, err
		}
		var revision Revision
		if err = json.Unmarshal(data, &revision); err != nil {
			return nil, err
		}
		revision.Settings, err = store.open(revision.Settings)
		if err != nil {
			return nil, err
		}
		result = append(result, revision)
	}
	sort.Slice(result, func(first, second int) bool { return result[first].ID > result[second].ID })
	// The newest revision is the current configuration, not a previous revision.
	if len(result) > 0 {
		result = result[1:]
	}
	return result, nil
}
