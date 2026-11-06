package configuration

import (
	"errors"
	"fmt"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration/profiles"
	"io"
	"net"
	"net/url"
	"strconv"
	"strings"
)

type Settings = profiles.Settings

func Validate(settings Settings) error {
	if strings.ContainsAny(settings.Host, " /?#@\r\n") || strings.ContainsAny(settings.SNI, " /?#@\r\n") {
		return errors.New("Укажите домен или IP без схемы и пути")
	}
	if port, err := strconv.Atoi(settings.Port); err != nil || port < 1 || port > 65535 {
		return errors.New("Укажите порт")
	}
	// Host may be empty until the first server setup.
	if settings.Host != "" {
		if _, err := url.Parse("hysteria2://" + net.JoinHostPort(strings.Trim(settings.Host, "[]"), settings.Port)); err != nil {
			return errors.New("Некорректный адрес или порт")
		}
	}
	var document map[string]any
	d := yaml.NewDecoder(strings.NewReader(settings.Config))
	if err := d.Decode(&document); err != nil {
		return fmt.Errorf("YAML: %w", err)
	}
	if len(document) == 0 {
		return errors.New("Конфигурация пуста")
	}
	var extra any
	if d.Decode(&extra) != io.EOF {
		return errors.New("Допускается только один YAML-документ")
	}
	if _, ok := document["tls"]; ok {
		if _, ok := document["acme"]; ok {
			return errors.New("tls и acme нельзя использовать одновременно")
		}
	}
	if _, ok := document["tls"]; !ok {
		if _, ok := document["acme"]; !ok {
			return errors.New("Нужен раздел tls или acme")
		}
	}
	if settings.AuthMode != "" && settings.AuthMode != "panel" && settings.AuthMode != "native" {
		return errors.New("неверный режим аутентификации")
	}
	if settings.AuthMode == "native" {
		auth, ok := document["auth"].(map[string]any)
		if !ok {
			return errors.New("нужен раздел auth")
		}
		kind, _ := auth["type"].(string)
		switch kind {
		case "password", "userpass", "http", "command":
		default:
			return errors.New("неверный тип auth")
		}
	}
	return nil
}
