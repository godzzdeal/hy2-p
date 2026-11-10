package disk

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const DockerSocket = "/var/run/docker.sock"
const MaxImageResponse = 4 << 20

func imageSizes(ctx context.Context, root string) (uint64, int, error) {
	entries, err := os.ReadDir(filepath.Join(root, "releases"))
	if err != nil {
		return 0, 0, err
	}
	tags := map[string]bool{}
	for _, entry := range entries {
		if entry.IsDir() && len(entry.Name()) == 40 {
			tags["hy2-panel:"+entry.Name()] = true
		}
	}
	transport := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", DockerSocket)
	}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 3 * time.Second}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://docker/images/json", nil)
	if err != nil {
		return 0, 0, err
	}
	response, err := client.Do(request)
	if err != nil {
		return 0, 0, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return 0, 0, errors.New("Docker images unavailable")
	}
	var images []struct {
		ID   string   `json:"Id"`
		Tags []string `json:"RepoTags"`
		Size uint64   `json:"Size"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, MaxImageResponse)).Decode(&images); err != nil {
		return 0, 0, err
	}
	seen := map[string]bool{}
	var total uint64
	for _, image := range images {
		for _, tag := range image.Tags {
			if tags[strings.TrimPrefix(tag, "docker.io/library/")] && !seen[image.ID] {
				seen[image.ID] = true
				total += image.Size
				break
			}
		}
	}
	return total, len(seen), nil
}
