package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func Token(credentials Credentials, previous *accounts.Token) (*accounts.Token, error) {
	if credentials.AccessToken == "" || credentials.ExpiresIn <= 0 || credentials.ExpiresIn > 400*24*60*60 {
		return nil, errors.New("Облако не вернуло действующий токен доступа")
	}
	refresh := credentials.RefreshToken
	if refresh == "" && previous != nil {
		refresh = previous.RefreshToken
	}
	if refresh == "" {
		return nil, errors.New("Облако не разрешило фоновый доступ. Подключите аккаунт заново")
	}
	return &accounts.Token{AccessToken: credentials.AccessToken, RefreshToken: refresh, TokenType: "Bearer", Expiry: time.Now().Add(time.Duration(credentials.ExpiresIn) * time.Second)}, nil
}

func Refresh(ctx context.Context, root string, account *accounts.Account) error {
	application, err := apps.Get(root, account.Provider)
	if err != nil {
		return err
	}
	if application.ClientID != account.ClientID {
		return errors.New("Настройки входа изменились. Подключите аккаунт заново")
	}
	body := url.Values{"grant_type": {"refresh_token"}, "refresh_token": {account.Token.RefreshToken}}
	if provider, err := apps.Find(account.Provider); err == nil && account.Provider == "onedrive" {
		body.Set("scope", provider.Scope)
	}
	credentials, err := Call(ctx, application, body)
	if err != nil {
		return err
	}
	token, err := Token(credentials, account.Token)
	if err == nil {
		account.Token = token
	}
	return err
}

func Drive(ctx context.Context, account *accounts.Account) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://graph.microsoft.com/v1.0/me/drive?$select=id,driveType", nil)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+account.Token.AccessToken)
	client := http.Client{Timeout: Timeout, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	response, err := client.Do(request)
	if err != nil {
		return errors.New("Не удалось определить диск OneDrive")
	}
	defer response.Body.Close()
	var drive struct {
		ID   string `json:"id"`
		Type string `json:"driveType"`
	}
	if response.StatusCode != http.StatusOK || json.NewDecoder(io.LimitReader(response.Body, MaxResponseBytes)).Decode(&drive) != nil || drive.ID == "" || strings.ContainsAny(drive.ID, "\r\n") {
		return errors.New("Диск OneDrive недоступен")
	}
	if drive.Type != "personal" && drive.Type != "business" && drive.Type != "documentLibrary" {
		return errors.New("Неизвестный тип диска OneDrive")
	}
	account.DriveID, account.DriveType = drive.ID, drive.Type
	return nil
}
