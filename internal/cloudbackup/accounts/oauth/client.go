package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const Timeout = 10 * time.Second
const FlowLifetime = 10 * time.Minute
const MaxResponseBytes = 64 << 10

type Authorization struct {
	URL    string `json:"url"`
	State  string `json:"state"`
	Origin string `json:"origin"`
}
type Credentials struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

func Call(ctx context.Context, application apps.Application, body url.Values) (Credentials, error) {
	var credentials Credentials
	provider, err := apps.Find(application.Provider)
	if err != nil {
		return credentials, err
	}
	body.Set("client_id", application.ClientID)
	body.Set("client_secret", application.Secret)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, provider.Token, strings.NewReader(body.Encode()))
	if err != nil {
		return credentials, errors.New("Не удалось подготовить авторизацию")
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := http.Client{Timeout: Timeout, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	response, err := client.Do(request)
	if err != nil {
		return credentials, errors.New("Облако недоступно. Повторите попытку позже")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return credentials, errors.New("Не удалось получить доступ к облаку. Подключите аккаунт заново")
	}
	payload, err := io.ReadAll(io.LimitReader(response.Body, MaxResponseBytes+1))
	if err != nil || len(payload) > MaxResponseBytes || json.Unmarshal(payload, &credentials) != nil {
		return credentials, errors.New("Некорректный ответ облачного сервиса")
	}
	return credentials, nil
}
