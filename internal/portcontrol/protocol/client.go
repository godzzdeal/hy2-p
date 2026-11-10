package protocol

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"time"
)

func Call(ctx context.Context, method string, request *Request) (Status, error) {
	return send(ctx, method, "/udp", request)
}

var ErrNotFound = errors.New("проверка не найдена")
var ErrBusy = errors.New("Другая операция уже выполняется")

func Ticket(ctx context.Context, id string) (Status, error) {
	if !TicketPattern.MatchString(id) {
		return Status{}, ErrNotFound
	}
	return send(ctx, "GET", "/udp/"+id, nil)
}
func send(ctx context.Context, method, path string, request *Request) (Status, error) {
	if request == nil {
		return Exchange[Status](ctx, method, path, nil)
	}
	return Exchange[Status](ctx, method, path, request)
}

func Exchange[T any](ctx context.Context, method, path string, request any) (T, error) {
	var result T
	var body io.Reader
	if request != nil {
		data, err := json.Marshal(request)
		if err != nil {
			return result, err
		}
		body = bytes.NewReader(data)
	}
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", Socket)
	}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(ctx, method, "http://port-agent"+path, body)
	if err != nil {
		return result, err
	}
	req.Header.Set("Content-Type", "application/json")
	response, err := client.Do(req)
	if err != nil {
		return result, err
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return result, ErrNotFound
	}
	if response.StatusCode == http.StatusConflict {
		return result, ErrBusy
	}
	payload, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil {
		return result, err
	}
	if err = json.Unmarshal(payload, &result); err != nil {
		return result, err
	}
	if response.StatusCode >= 400 {
		var failure struct {
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		if json.Unmarshal(payload, &failure) != nil {
			return result, errors.New("помощник вернул ошибку")
		}
		if failure.Message != "" {
			return result, errors.New(failure.Message)
		}
		if failure.Error != "" {
			return result, errors.New(failure.Error)
		}
		return result, errors.New("помощник вернул ошибку")
	}
	return result, nil
}

func Busy(ctx context.Context) bool {
	status, err := Call(ctx, "GET", nil)
	return err == nil && status.Busy
}
