package accounts

import (
	"errors"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
	"regexp"
	"sort"
)

var IDPattern = regexp.MustCompile(`^(legacy|[a-f0-9]{32})$`)

func Read(root string) (Catalog, error) {
	var catalog Catalog
	directory := filepath.Join(root, "cloud-backup")
	err := records.Read(directory, "accounts", &catalog)
	if !os.IsNotExist(err) {
		return catalog, err
	}
	var legacy struct {
		Destination string `json:"destination"`
		ConfigText  string `json:"configText"`
	}
	err = records.Read(directory, "settings", &legacy)
	if os.IsNotExist(err) {
		return Catalog{Accounts: []Account{}}, nil
	}
	if err == nil && legacy.ConfigText != "" {
		catalog.Accounts = []Account{{ID: LegacyID, Name: "rclone", Provider: "rclone", Folder: legacy.Destination, Destination: legacy.Destination, ConfigText: legacy.ConfigText}}
	}
	return catalog, err
}

func Save(root string, catalog Catalog) error {
	directory := filepath.Join(root, "cloud-backup")
	if err := records.Write(directory, "accounts", catalog); err != nil {
		return err
	}
	// Credentials are not an undo history. Keep only the latest private record.
	for _, kind := range []string{"accounts", "settings"} {
		paths, err := filepath.Glob(filepath.Join(directory, kind+"-*.json"))
		if err != nil {
			return err
		}
		sort.Strings(paths)
		if kind == "accounts" && len(paths) > 0 {
			paths = paths[:len(paths)-1]
		}
		for _, path := range paths {
			if err = os.Remove(path); err != nil {
				return err
			}
		}
	}
	return nil
}

func Find(catalog Catalog, id string) (int, error) {
	if id == "" && len(catalog.Accounts) == 1 {
		return 0, nil
	}
	if IDPattern.MatchString(id) {
		for index, account := range catalog.Accounts {
			if account.ID == id {
				return index, nil
			}
		}
	}
	return -1, errors.New("Выберите подключённое хранилище")
}
