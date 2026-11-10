package subscriptions

import (
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/certificates/files"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core/tools"
	"hy2-panel/internal/security"
	"hy2-panel/internal/users"
	"net"
	"net/url"
	"strings"
)

func ConnectionURI(settings configuration.Settings, user users.User, data string) (string, error) {
	if settings.AuthMode == "native" {
		return "", errors.New("Подписки панели требуют режима управления пользователями через панель")
	}
	if settings.Host == "" {
		return "", errors.New("Сначала укажите публичный адрес сервера в настройках")
	}
	var document map[string]any
	if err := yaml.Unmarshal([]byte(settings.Config), &document); err != nil {
		return "", err
	}
	q := url.Values{}
	pin, err := security.CertificatePin(settings.PinSHA256)
	if err != nil {
		return "", err
	}
	if settings.PinFromCertificate {
		name := settings.SNI
		if name == "" {
			name = settings.Host
		}
		pin, err = files.FromConfig(settings.Config, data, name)
		if err != nil {
			return "", err
		}
	}
	if pin != "" {
		q.Set("pinSHA256", pin)
	}
	if settings.SNI != "" {
		q.Set("sni", settings.SNI)
	}
	if obfs, ok := document["obfs"].(map[string]any); ok {
		kind, _ := obfs["type"].(string)
		if kind != "" {
			if kind != "salamander" {
				return "", errors.New("Экспорт для Happ поддерживает только Salamander; измените obfs")
			}
			settings, _ := obfs[kind].(map[string]any)
			pw, _ := settings["password"].(string)
			if pw == "" {
				return "", errors.New("Не задан пароль obfs")
			}
			q.Set("obfs", kind)
			q.Set("obfs-password", pw)
		}
	}
	if _, ok := document["realm"]; ok {
		return "", errors.New("Экспорт режима Realm пока не поддерживается")
	}
	if ech, ok := document["ech"].(map[string]any); ok {
		path, _ := ech["keyPath"].(string)
		if path != "" {
			public, err := tools.Inspect(path)
			if err != nil {
				return "", err
			}
			q.Set("ech", public.ConfigList)
		}
	}
	if timestamp, ok := document["tls"].(map[string]any); ok {
		if _, ok := timestamp["clientCA"]; ok {
			return "", errors.New("Для mTLS требуется клиентский сертификат; экспорт ссылки недоступен")
		}
	}
	uri := url.URL{Scheme: "hy2", User: url.User(user.Password), Host: net.JoinHostPort(strings.Trim(settings.Host, "[]"), settings.Port), Path: "/", RawQuery: q.Encode(), Fragment: user.Name}
	return uri.String(), nil
}
