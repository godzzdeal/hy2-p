package statistics

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/security"
	"net/http"
)

func (client Client) KickIdentity(ctx context.Context, id string) error {
	return client.kick(ctx, []string{id})
}
func (client Client) KickUser(ctx context.Context, target string) error {
	ids := []string{target}
	if online, err := client.Online(ctx); err == nil {
		for id := range online {
			if id != target && security.MatchesIdentity(id, target) {
				ids = append(ids, id)
			}
		}
	}
	return client.kick(ctx, ids)
}
func (client Client) kick(ctx context.Context, ids []string) error {
	payload, err := json.Marshal(ids)
	if err != nil {
		return err
	}
	request, err := http.NewRequest("POST", client.Address+"/kick", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	response, err := client.request(ctx, request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return errors.New("Не удалось отключить подключение")
	}
	return nil
}
