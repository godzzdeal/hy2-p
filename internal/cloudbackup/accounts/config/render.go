package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"hy2-panel/internal/cloudbackup/accounts"
	"strings"
)

type Transfer struct {
	Destination string `json:"destination"`
	ConfigText  string `json:"configText"`
}

func Create(input accounts.Input, id string) (accounts.Account, error) {
	if err := accounts.Validate(input); err != nil {
		return accounts.Account{}, err
	}
	account := accounts.Account{ID: id, Name: strings.TrimSpace(input.Name), Provider: input.Provider, Folder: input.Folder}
	switch input.Provider {
	case "s3":
		account.ConfigText = fmt.Sprintf("[cloud]\ntype = s3\nprovider = Other\naccess_key_id = %s\nsecret_access_key = %s\nendpoint = %s\nregion = %s\n", input.AccessKey, input.SecretKey, input.Endpoint, input.Region)
	case "webdav":
		password, err := obscure(input.Password)
		if err != nil {
			return account, err
		}
		account.ConfigText = fmt.Sprintf("[cloud]\ntype = webdav\nvendor = other\nurl = %s\nuser = %s\npass = %s\n", input.Endpoint, input.Username, password)
	case "rclone":
		account.ConfigText, account.Destination = input.ConfigText, input.Destination
		account.Folder = input.Destination
	default:
		return account, errors.New("Подключите аккаунт через браузер")
	}
	return account, nil
}

func Render(account accounts.Account) (Transfer, error) {
	if account.Provider == "rclone" {
		return Transfer{account.Destination, account.ConfigText}, nil
	}
	text := account.ConfigText
	if account.Token != nil {
		// Refresh is performed by the helper before each transfer. No project secret
		// or refresh token is given to the disposable transfer container.
		token := *account.Token
		token.RefreshToken = ""
		payload, err := json.Marshal(token)
		if err != nil {
			return Transfer{}, err
		}
		types := map[string]string{"yandex": "yandex", "google": "drive", "dropbox": "dropbox", "onedrive": "onedrive"}
		backend, ok := types[account.Provider]
		if !ok {
			return Transfer{}, errors.New("Неизвестное хранилище")
		}
		text = "[cloud]\ntype = " + backend + "\ntoken = " + string(payload) + "\n"
		if account.Provider == "yandex" {
			text += "app_folder = true\n"
		}
		if account.Provider == "google" {
			text += "scope = drive.file\n"
		}
		if account.Provider == "onedrive" {
			text += "drive_id = " + account.DriveID + "\ndrive_type = " + account.DriveType + "\n"
		}
	}
	if text == "" {
		return Transfer{}, errors.New("Хранилище не подключено")
	}
	return Transfer{"cloud:" + account.Folder, text}, nil
}
