package files

import (
	"errors"
	"gopkg.in/yaml.v3"
	"os"
	"path/filepath"
	"strings"
)

const MaxCacheEntries = 512

func Sources(source, data string) (string, []string, error) {
	var document struct {
		TLS *struct {
			Cert string `yaml:"cert"`
		} `yaml:"tls"`
		ACME *struct {
			Dir string `yaml:"dir"`
		} `yaml:"acme"`
	}
	if err := yaml.Unmarshal([]byte(source), &document); err != nil {
		return "", nil, err
	}
	if document.ACME == nil {
		if document.TLS != nil && document.TLS.Cert != "" {
			return "tls", []string{document.TLS.Cert}, nil
		}
		return "tls", nil, nil
	}
	directory := document.ACME.Dir
	if directory == "" {
		directory = filepath.Join(data, "acme-hy2")
	}
	paths := []string{}
	count := 0
	err := filepath.WalkDir(directory, func(path string, entry os.DirEntry, walkError error) error {
		if walkError != nil {
			return walkError
		}
		count++
		if count > MaxCacheEntries {
			return errors.New("Слишком много файлов в кеше сертификатов")
		}
		if !entry.IsDir() && strings.HasSuffix(path, ".crt") {
			paths = append(paths, path)
		}
		return nil
	})
	if os.IsNotExist(err) {
		err = nil
	}
	return "acme", paths, err
}
