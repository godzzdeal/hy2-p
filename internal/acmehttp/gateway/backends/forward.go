package backends

import (
	"context"
	"io"
	"net"
	"net/http"
	"strconv"
)

func forward(ctx context.Context, original *http.Request, port int) response {
	address := "http://" + net.JoinHostPort("127.0.0.1", strconv.Itoa(port)) + original.URL.EscapedPath()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, address, nil)
	if err != nil {
		return response{}
	}
	request.Host = original.Host
	result, err := client.Do(request)
	if err != nil {
		return response{}
	}
	defer result.Body.Close()
	if result.StatusCode != http.StatusOK {
		return response{}
	}
	body, err := io.ReadAll(io.LimitReader(result.Body, MaxResponse+1))
	if err != nil || len(body) > MaxResponse {
		return response{}
	}
	return response{body: body, status: result.StatusCode}
}
