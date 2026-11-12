package cloudbackup

import (
	"errors"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

const Path = "/backup/settings"
const MaxConfigBytes = 256 << 10

var destinationPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+:[^\x00-\x1f]*$`)

type Config struct {
	Destination string `json:"destination"`
	ConfigText  string `json:"configText,omitempty"`
}

func Read(root string) (Config, error) {
	var config Config
	err := records.Read(filepath.Join(root, "cloud-backup"), "settings", &config)
	if os.IsNotExist(err) {
		err = nil
	}
	return config, err
}
func Validate(config Config) error {
	if !destinationPattern.MatchString(config.Destination) || strings.Contains(config.Destination, "..") || strings.Contains(config.Destination, "\\") {
		return errors.New("Укажите папку в формате disk:HY2-P")
	}
	if len(config.ConfigText) == 0 || len(config.ConfigText) > MaxConfigBytes {
		return errors.New("Загрузите конфигурацию rclone размером до 256 КБ")
	}
	remote := strings.SplitN(config.Destination, ":", 2)[0]
	if !strings.Contains(config.ConfigText, "["+remote+"]") {
		return errors.New("Указанное хранилище отсутствует в конфигурации rclone")
	}
	return nil
}
