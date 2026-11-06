package statistics

import (
	"context"
	"net/http"
	"time"
)

const Timeout = 2 * time.Second
const MaxPayload = 8 << 20

type Client struct{ Address, Secret string }

func (client Client) request(ctx context.Context, request *http.Request) (*http.Response, error) {
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", client.Secret)
	request.Header.Set("Content-Type", "application/json")
	transport := http.Client{Timeout: Timeout}
	return transport.Do(request)
}
