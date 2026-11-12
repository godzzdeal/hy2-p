package service

import (
	"context"
	"errors"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/config"
	"hy2-panel/internal/cloudbackup/accounts/oauth"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
	"sync"
)

type Service struct {
	Root    string
	Mu      *sync.Mutex
	IsBusy  func() bool
	flowsMu sync.Mutex
	flows   map[string]flow
}

func (service *Service) Handler(writer http.ResponseWriter, request *http.Request) {
	if request.Method == http.MethodGet {
		service.Mu.Lock()
		catalog, err := accounts.Read(service.Root)
		service.Mu.Unlock()
		if err != nil {
			transport.Fail(writer, errors.New("Не удалось прочитать хранилища"), 500)
			return
		}
		transport.Respond(writer, map[string]any{"accounts": accounts.Summaries(catalog)})
		return
	}
	var input accounts.Input
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	var result any
	var err error
	switch input.Action {
	case "providers", "provider":
		result, err = service.providers(input)
	case "authorize":
		result, err = service.authorize(request.Context(), input)
	case "complete":
		result, err = service.complete(request.Context(), input)
	case "create", "update", "delete":
		result, err = service.mutate(input)
	default:
		err = errors.New("Неизвестная операция хранилища")
	}
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	transport.Respond(writer, result)
}

func (service *Service) mutate(input accounts.Input) (any, error) {
	release, err := service.writeLock()
	if err != nil {
		return nil, err
	}
	defer release()
	catalog, err := accounts.Read(service.Root)
	if err != nil {
		return nil, errors.New("Не удалось прочитать хранилища")
	}
	if input.Action == "create" {
		if len(catalog.Accounts) >= accounts.MaxAccounts {
			return nil, errors.New("Можно подключить до 12 хранилищ")
		}
		account, err := config.Create(input, security.Token()[:32])
		if err != nil {
			return nil, err
		}
		catalog.Accounts = append(catalog.Accounts, account)
	} else {
		index, err := accounts.Find(catalog, input.ID)
		if err != nil {
			return nil, err
		}
		if input.Action == "delete" {
			catalog.Accounts = append(catalog.Accounts[:index], catalog.Accounts[index+1:]...)
		} else {
			account := catalog.Accounts[index]
			if account.Provider == "rclone" {
				return nil, errors.New("Для смены папки rclone подключите хранилище заново")
			}
			if account.Provider == "s3" && input.Folder == "" {
				return nil, errors.New("Укажите бакет и папку")
			}
			if err := accounts.Validate(accounts.Input{Name: input.Name, Folder: input.Folder, Provider: "google"}); err != nil {
				return nil, err
			}
			account.Name, account.Folder = input.Name, input.Folder
			catalog.Accounts[index] = account
		}
	}
	if err := accounts.Save(service.Root, catalog); err != nil {
		return nil, errors.New("Не удалось сохранить хранилища")
	}
	return accounts.Summaries(catalog), nil
}

func (service *Service) saveAuthorized(ctx context.Context, account accounts.Account) (any, error) {
	if account.Provider == "onedrive" {
		if err := oauth.Drive(ctx, &account); err != nil {
			return nil, err
		}
	}
	release, err := service.writeLock()
	if err != nil {
		return nil, err
	}
	defer release()
	catalog, err := accounts.Read(service.Root)
	if err != nil {
		return nil, errors.New("Не удалось прочитать хранилища")
	}
	if len(catalog.Accounts) >= accounts.MaxAccounts {
		return nil, errors.New("Можно подключить до 12 хранилищ")
	}
	catalog.Accounts = append(catalog.Accounts, account)
	if err = accounts.Save(service.Root, catalog); err != nil {
		return nil, errors.New("Не удалось сохранить хранилище")
	}
	return accounts.Summaries(catalog), nil
}
