package apps

import (
	"errors"
	"net/url"
)

type Provider struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Authorize string `json:"-"`
	Token     string `json:"-"`
	Scope     string `json:"-"`
}

var Providers = []Provider{
	{"yandex", "Яндекс Диск", "https://oauth.yandex.ru/authorize", "https://oauth.yandex.ru/token", "cloud_api:disk.app_folder"},
	{"google", "Google Drive", "https://accounts.google.com/o/oauth2/v2/auth", "https://oauth2.googleapis.com/token", "https://www.googleapis.com/auth/drive.file"},
	{"dropbox", "Dropbox", "https://www.dropbox.com/oauth2/authorize", "https://api.dropboxapi.com/oauth2/token", "files.content.write files.content.read files.metadata.read"},
	{"onedrive", "OneDrive", "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", "https://login.microsoftonline.com/common/oauth2/v2.0/token", "offline_access Files.ReadWrite"},
}

func Find(id string) (Provider, error) {
	for _, provider := range Providers {
		if provider.ID == id {
			return provider, nil
		}
	}
	return Provider{}, errors.New("Выберите облачный сервис")
}

func Origin(value string) (string, error) {
	parsed, err := url.Parse(value)
	if err != nil {
		return "", errors.New("Некорректный адрес панели")
	}
	isLocal := parsed.Hostname() == "localhost" || parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "::1"
	if (parsed.Scheme != "https" && !(isLocal && parsed.Scheme == "http")) || parsed.Hostname() == "" || parsed.User != nil || (parsed.Path != "" && parsed.Path != "/") || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", errors.New("Для подключения облака откройте панель через HTTPS")
	}
	return parsed.Scheme + "://" + parsed.Host, nil
}

func (provider Provider) Callback(origin string) string {
	return origin + "/connect/callback/" + provider.ID
}
