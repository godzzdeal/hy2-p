package accounts

import (
	"errors"
	"net/url"
	"regexp"
	"strings"
	"unicode"
)

var remotePattern = regexp.MustCompile(`^[a-zA-Z0-9_][a-zA-Z0-9_-]*$`)

func Validate(input Input) error {
	if strings.TrimSpace(input.Name) == "" || len([]rune(input.Name)) > 80 {
		return errors.New("Укажите название хранилища: до 80 символов")
	}
	if err := ValidateFolder(input.Folder); err != nil {
		return err
	}
	for _, value := range []string{input.Name, input.Endpoint, input.Username, input.Password, input.AccessKey, input.SecretKey, input.Region} {
		if len(value) > 4096 || strings.ContainsAny(value, "\r\n\x00") {
			return errors.New("В настройках хранилища недопустимые символы")
		}
	}
	switch input.Provider {
	case "s3", "webdav":
		endpoint, err := url.Parse(input.Endpoint)
		if err != nil || endpoint.Scheme != "https" || endpoint.Hostname() == "" || endpoint.User != nil || endpoint.RawQuery != "" || endpoint.Fragment != "" {
			return errors.New("Укажите HTTPS-адрес хранилища")
		}
		if input.Provider == "s3" && (input.AccessKey == "" || input.SecretKey == "") {
			return errors.New("Укажите ключ доступа и секретный ключ")
		}
		if input.Provider == "s3" && strings.Trim(input.Folder, "/") == "" {
			return errors.New("Укажите бакет и папку")
		}
		if input.Provider == "webdav" && (input.Username == "" || input.Password == "") {
			return errors.New("Укажите логин и пароль хранилища")
		}
	case "rclone":
		if len(input.ConfigText) == 0 || len(input.ConfigText) > MaxConfigBytes {
			return errors.New("Загрузите конфигурацию rclone размером до 256 КБ")
		}
		remote, _, ok := strings.Cut(input.Destination, ":")
		if !ok || !remotePattern.MatchString(remote) || !strings.Contains(input.ConfigText, "["+remote+"]") || strings.ContainsFunc(input.Destination, unicode.IsControl) || strings.Contains(input.Destination, "\\") || strings.Contains(input.Destination, "..") {
			return errors.New("Укажите папку в формате disk:HY2-P")
		}
	case "yandex", "google", "dropbox", "onedrive":
	default:
		return errors.New("Неизвестное облачное хранилище")
	}
	return nil
}

func ValidateFolder(folder string) error {
	if len(folder) > 512 || strings.Contains(folder, "\\") || strings.HasPrefix(folder, "/") {
		return errors.New("Укажите относительный путь к папке")
	}
	for _, part := range strings.Split(folder, "/") {
		if part == "." || part == ".." {
			return errors.New("Укажите относительный путь к папке")
		}
	}
	if strings.ContainsFunc(folder, unicode.IsControl) {
		return errors.New("В пути к папке недопустимые символы")
	}
	return nil
}
