package statistics

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

func (client Client) Online(ctx context.Context) (map[string]int, error) {
	request, err := http.NewRequest("GET", client.Address+"/online", nil)
	if err != nil {
		return nil, err
	}
	response, err := client.request(ctx, request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, errors.New("API статистики недоступен")
	}
	var online map[string]int
	err = json.NewDecoder(io.LimitReader(response.Body, MaxPayload)).Decode(&online)
	return online, err
}
