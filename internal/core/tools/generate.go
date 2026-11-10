package tools

import (
	"context"
	"errors"
	"hy2-panel/internal/security"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const GenerationTimeout = 10 * time.Second

var domainLabel = regexp.MustCompile(`^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$`)

func ValidName(name string) bool {
	if len(name) > 253 || !strings.Contains(name, ".") {
		return false
	}
	for _, label := range strings.Split(name, ".") {
		if !domainLabel.MatchString(label) {
			return false
		}
	}
	return true
}
func Generate(ctx context.Context, binaryPath, data, name string) (ECH, error) {
	if !ValidName(name) {
		return ECH{}, errors.New("Укажите доменное имя для внешнего SNI ECH")
	}
	directory := filepath.Join(data, "ech", security.Token())
	if err := os.MkdirAll(directory, 0700); err != nil {
		return ECH{}, err
	}
	path := filepath.Join(directory, "ech.pem")
	succeeded := false
	defer func() {
		if !succeeded {
			os.Remove(path)
			os.Remove(directory)
		}
	}()
	ctx, cancel := context.WithTimeout(ctx, GenerationTimeout)
	defer cancel()
	// CLI output can contain private material: never forward stdout/stderr.
	command := exec.CommandContext(ctx, binaryPath, "ech", "--public-name", name, "--output", path)
	if err := command.Run(); err != nil {
		return ECH{}, errors.New("Не удалось создать ECH. Требуется экземпляр HY2 с командой ech (2.12.3 или новее)")
	}
	if err := os.Chmod(path, 0600); err != nil {
		return ECH{}, err
	}
	result, err := Inspect(path)
	if err != nil {
		return ECH{}, err
	}
	result.KeyPath = filepath.ToSlash(path)
	if result.PublicName == "" {
		result.PublicName = name
	}
	succeeded = true
	return result, nil
}
