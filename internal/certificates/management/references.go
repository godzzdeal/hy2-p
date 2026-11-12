package management

import (
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/certificates/files"
	"hy2-panel/internal/configuration"
	"io"
	"os"
	"path/filepath"
)

type Reference struct {
	Source  string
	Data    string
	Running bool
}

const MaxRuntimeSize = 8 << 20

func Runtime(data string) (string, error) {
	root, err := os.OpenRoot(data)
	if err != nil {
		return "", err
	}
	defer root.Close()
	file, err := root.Open(configuration.RuntimeFilename)
	if err != nil {
		return "", err
	}
	defer file.Close()
	payload, err := io.ReadAll(io.LimitReader(file, MaxRuntimeSize+1))
	if err != nil || len(payload) > MaxRuntimeSize {
		return "", errors.New("Не удалось проверить действующую конфигурацию экземпляра")
	}
	return string(payload), nil
}

func referenced(certificate files.Certificate, reference Reference) (bool, error) {
	var config struct {
		TLS *struct {
			Cert     string `yaml:"cert"`
			Key      string `yaml:"key"`
			ClientCA string `yaml:"clientCA"`
		} `yaml:"tls"`
		ACME *struct {
			Domains []string `yaml:"domains"`
			Dir     string   `yaml:"dir"`
		} `yaml:"acme"`
	}
	if err := yaml.Unmarshal([]byte(reference.Source), &config); err != nil {
		return false, err
	}
	if config.TLS != nil {
		return samePath(certificate.Path, config.TLS.Cert) || samePath(certificate.Path, config.TLS.ClientCA) ||
			samePath(keyFor(certificate.Path), config.TLS.Key), nil
	}
	if config.ACME == nil {
		return false, nil
	}
	directory := config.ACME.Dir
	if directory == "" {
		directory = filepath.Join(reference.Data, "acme-hy2")
	}
	if !inside(directory, certificate.Path) {
		return false, nil
	}
	for _, domain := range config.ACME.Domains {
		if certificate.MatchesName(domain) {
			return true, nil
		}
	}
	return false, nil
}

func inside(directory, path string) bool {
	root, err := filepath.Abs(directory)
	if err != nil {
		return false
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return false
	}
	relative, err := filepath.Rel(root, absolute)
	return err == nil && relative != "." && filepath.IsLocal(relative)
}

func samePath(first, second string) bool {
	if first == "" || second == "" {
		return false
	}
	left, err := filepath.Abs(first)
	if err != nil {
		return false
	}
	right, err := filepath.Abs(second)
	if err != nil {
		return false
	}
	if resolved, resolveError := filepath.EvalSymlinks(left); resolveError == nil {
		left = resolved
	}
	if resolved, resolveError := filepath.EvalSymlinks(right); resolveError == nil {
		right = resolved
	}
	return left == right
}
