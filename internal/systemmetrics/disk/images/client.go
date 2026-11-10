package images

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"time"
)

const DockerSocket = "/var/run/docker.sock"
const maxResponse = 4 << 20

func newClient() *http.Client {
	return &http.Client{Transport: &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", DockerSocket)
	}}, Timeout: 5 * time.Second}
}

func readJSON(ctx context.Context, client *http.Client, path string, value any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://docker"+path, nil)
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return errors.New("Docker image usage unavailable")
	}
	return json.NewDecoder(io.LimitReader(response.Body, maxResponse)).Decode(value)
}
