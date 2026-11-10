package validation

import (
	"fmt"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"os"
)

func challengePort(settings configuration.Settings) (int, error) {
	var document struct {
		ACME *struct {
			Type string `yaml:"type"`
			HTTP struct {
				Port int `yaml:"altPort"`
			} `yaml:"http"`
			TLS struct {
				Port int `yaml:"altPort"`
			} `yaml:"tls"`
		} `yaml:"acme"`
	}
	if err := yaml.Unmarshal([]byte(settings.Config), &document); err != nil {
		return 0, err
	}
	acme := document.ACME
	if acme == nil || acme.Type == "dns" {
		return 0, nil
	}
	if acme.Type == "tls" {
		if acme.TLS.Port != 0 {
			return acme.TLS.Port, nil
		}
		return 443, nil
	}
	if os.Getenv("PANEL_CONTAINER") == "true" {
		return 0, nil
	}
	if acme.HTTP.Port != 0 {
		return acme.HTTP.Port, nil
	}
	return 80, nil
}
func ACME(id string, candidate configuration.Settings, entries []Entry) error {
	port, err := challengePort(candidate)
	if err != nil || port == 0 {
		return err
	}
	for _, entry := range entries {
		if entry.ID == id || entry.Removing {
			continue
		}
		other, err := challengePort(entry.Settings)
		if err != nil {
			return err
		}
		if other == port {
			return fmt.Errorf("TCP-порт ACME %d уже используется экземпляром %s. В Docker используйте acme.type: http или готовый TLS-сертификат", port, entry.ID)
		}
	}
	return nil
}
