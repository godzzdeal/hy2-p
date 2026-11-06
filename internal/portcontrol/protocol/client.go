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
	var result Status
	var body io.Reader
	if request != nil {
		data, _ := json.Marshal(request)
		body = bytes.NewReader(data)
	}
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", Socket)
	}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(ctx, method, "http://port-agent/udp", body)
	if err != nil {
		return result, err
	}
	req.Header.Set("Content-Type", "application/json")
	response, err := client.Do(req)
	if err != nil {
		return result, err
	}
	defer response.Body.Close()
	if err = json.NewDecoder(io.LimitReader(response.Body, 8192)).Decode(&result); err != nil {
		return result, err
	}
	if response.StatusCode >= 400 {
		return result, errors.New(result.Message)
	}
	return result, nil
}

func Busy(ctx context.Context) bool {
	status, err := Call(ctx, "GET", nil)
	return err == nil && status.Busy
}
