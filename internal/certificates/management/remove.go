package management

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func owned(data, path string) bool {
	if !inside(data, path) {
		return false
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return false
	}
	for current := absolute; ; current = filepath.Dir(current) {
		info, err := os.Lstat(current)
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return false
		}
		if filepath.Dir(current) == current {
			return true
		}
	}
}

func keyFor(path string) string {
	if filepath.Base(path) == "cert.pem" {
		return filepath.Join(filepath.Dir(path), "key.pem")
	}
	return strings.TrimSuffix(path, filepath.Ext(path)) + ".key"
}

func Remove(data string, entry Entry) error {
	if !entry.CanDelete || !owned(data, entry.Path) {
		return errors.New("Удаление сертификата недоступно")
	}
	data, err := filepath.Abs(data)
	if err != nil {
		return err
	}
	root, err := os.OpenRoot(data)
	if err != nil {
		return err
	}
	defer root.Close()
	paths := []string{entry.Path, keyFor(entry.Path)}
	if entry.Source == "acme" {
		paths = append(paths, strings.TrimSuffix(entry.Path, filepath.Ext(entry.Path))+".json")
	}
	for _, path := range paths {
		if _, err := os.Lstat(path); os.IsNotExist(err) {
			continue
		} else if err != nil {
			return err
		}
		if !owned(data, path) {
			return errors.New("Связанный файл сертификата недоступен для удаления")
		}
	}
	for _, path := range paths {
		path, err = filepath.Abs(path)
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(data, path)
		if err != nil || !filepath.IsLocal(relative) {
			return errors.New("Некорректный путь сертификата")
		}
		if err := root.Remove(relative); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}
