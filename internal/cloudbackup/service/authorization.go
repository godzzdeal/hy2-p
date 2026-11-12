package service

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/oauth"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"hy2-panel/internal/security"
	"net/url"
	"time"
)

type flow struct {
	account  accounts.Account
	verifier string
	origin   string
	expires  time.Time
}

func (service *Service) authorize(_ context.Context, input accounts.Input) (any, error) {
	provider, err := apps.Find(input.Provider)
	if err != nil {
		return nil, err
	}
	if err := accounts.Validate(input); err != nil {
		return nil, err
	}
	origin, err := apps.Origin(input.Origin)
	if err != nil {
		return nil, err
	}
	service.Mu.Lock()
	application, err := apps.Get(service.Root, input.Provider)
	isBusy := service.IsBusy()
	service.Mu.Unlock()
	if err != nil {
		return nil, err
	}
	if isBusy {
		return nil, errors.New("Дождитесь завершения обслуживания панели")
	}
	if application.Origin != origin {
		return nil, errors.New("Адрес панели изменился. Обновите адрес возврата в настройках входа")
	}
	verifier, state := security.Token(), security.Token()
	challenge := sha256.Sum256([]byte(verifier))
	parameters := url.Values{"response_type": {"code"}, "client_id": {application.ClientID}, "redirect_uri": {provider.Callback(origin)}, "scope": {provider.Scope}, "state": {state}, "code_challenge": {base64.RawURLEncoding.EncodeToString(challenge[:])}, "code_challenge_method": {"S256"}}
	if input.Provider == "google" {
		parameters.Set("access_type", "offline")
		parameters.Set("prompt", "consent")
	}
	if input.Provider == "dropbox" {
		parameters.Set("token_access_type", "offline")
	}
	if input.Provider == "yandex" {
		parameters.Set("force_confirm", "yes")
	}
	service.flowsMu.Lock()
	defer service.flowsMu.Unlock()
	if service.flows == nil {
		service.flows = make(map[string]flow)
	}
	for id, pending := range service.flows {
		if time.Now().After(pending.expires) {
			delete(service.flows, id)
		}
	}
	if len(service.flows) >= accounts.MaxAccounts {
		return nil, errors.New("Завершите предыдущую авторизацию или повторите через 10 минут")
	}
	service.flows[state] = flow{accounts.Account{ID: security.Token()[:32], Name: input.Name, Provider: input.Provider, Folder: input.Folder, ClientID: application.ClientID}, verifier, origin, time.Now().Add(oauth.FlowLifetime)}
	return oauth.Authorization{URL: provider.Authorize + "?" + parameters.Encode(), State: state, Origin: origin}, nil
}

func (service *Service) complete(ctx context.Context, input accounts.Input) (any, error) {
	service.flowsMu.Lock()
	pending, ok := service.flows[input.State]
	delete(service.flows, input.State)
	service.flowsMu.Unlock()
	if !ok || time.Now().After(pending.expires) || input.Code == "" || len(input.Code) > 4096 {
		return nil, errors.New("Авторизация истекла. Подключите аккаунт заново")
	}
	application, err := apps.Get(service.Root, pending.account.Provider)
	if err != nil {
		return nil, err
	}
	if application.ClientID != pending.account.ClientID || application.Origin != pending.origin {
		return nil, errors.New("Настройки входа изменились. Подключите аккаунт заново")
	}
	provider, err := apps.Find(application.Provider)
	if err != nil {
		return nil, err
	}
	credentials, err := oauth.Call(ctx, application, url.Values{"grant_type": {"authorization_code"}, "code": {input.Code}, "code_verifier": {pending.verifier}, "redirect_uri": {provider.Callback(pending.origin)}})
	if err != nil {
		return nil, err
	}
	token, err := oauth.Token(credentials, nil)
	if err != nil {
		return nil, err
	}
	pending.account.Token = token
	return service.saveAuthorized(ctx, pending.account)
}
