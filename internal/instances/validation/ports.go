package validation

import (
	"errors"
	"fmt"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"net"
	"strconv"
)

func listen(settings configuration.Settings) (string, error) {
	var document struct {
		Listen string `yaml:"listen"`
	}
	if err := yaml.Unmarshal([]byte(settings.Config), &document); err != nil {
		return "", err
	}
	if document.Listen == "" {
		document.Listen = ":443"
	}
	host, port, err := net.SplitHostPort(document.Listen)
	number, parseError := strconv.Atoi(port)
	if err != nil || parseError != nil || number < 1 || number > 65535 {
		return "", errors.New("Для нескольких ядер укажите один UDP-порт в listen")
	}
	if host != "" && host != "0.0.0.0" && host != "::" {
		return "", errors.New("Для нескольких ядер укажите listen без фиксированного IP")
	}
	return strconv.Itoa(number), nil
}
func Ports(id string, candidate configuration.Settings, entries []Entry) error {
	// Keep existing single-core configurations compatible until a second core is added.
	if id == "default" && len(entries) == 1 {
		return nil
	}
	target, err := listen(candidate)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.ID == id {
			continue
		}
		otherTarget, err := listen(entry.Settings)
		if err != nil && !entry.Removing {
			return fmt.Errorf("Ядро %s: %w", entry.ID, err)
		}
		if !entry.Removing && (entry.Settings.Port == candidate.Port || otherTarget == target) {
			return fmt.Errorf("UDP-порт уже используется конфигурацией ядра %s", entry.ID)
		}
		if entry.PublicPort == candidate.Port || entry.ListenPort == target {
			return fmt.Errorf("UDP-порт ещё опубликован для ядра %s. Сначала примените его сетевые изменения", entry.ID)
		}
	}
	return nil
}
