package images

import (
	"context"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type summary struct {
	ID         string            `json:"Id"`
	Tags       []string          `json:"RepoTags"`
	Labels     map[string]string `json:"Labels"`
	Size       int64             `json:"Size"`
	SharedSize int64             `json:"SharedSize"`
}

var commitPattern = regexp.MustCompile(`^[a-f0-9]{40}$`)

func Measure(ctx context.Context, root string) (uint64, int, error) {
	client := newClient()
	defer client.CloseIdleConnections()
	return measure(ctx, client, root)
}

func measure(ctx context.Context, client *http.Client, root string) (uint64, int, error) {
	entries, err := os.ReadDir(filepath.Join(root, "releases"))
	if err != nil {
		return 0, 0, err
	}
	commits := make(map[string]bool)
	for _, entry := range entries {
		if entry.IsDir() && commitPattern.MatchString(entry.Name()) {
			commits[entry.Name()] = true
		}
	}
	var usage struct {
		LayersSize int64     `json:"LayersSize"`
		Images     []summary `json:"Images"`
	}
	if err := readJSON(ctx, client, "/system/df?type=image", &usage); err != nil {
		return 0, 0, err
	}
	selected := make([]summary, 0, len(usage.Images))
	seen := make(map[string]bool)
	for _, image := range usage.Images {
		if !seen[image.ID] && isOwned(image, commits) {
			selected = append(selected, image)
			seen[image.ID] = true
		}
	}
	if len(selected) == 0 {
		return 0, 0, nil
	}
	// Docker calculates the physical union, including containerd's content store.
	if len(selected) == len(usage.Images) && usage.LayersSize >= 0 {
		return uint64(usage.LayersSize), len(selected), nil
	}
	if len(selected) == 1 && selected[0].Size >= 0 {
		return uint64(selected[0].Size), 1, nil
	}
	var info struct{ DriverStatus [][]string }
	if err := readJSON(ctx, client, "/info", &info); err != nil {
		return 0, len(selected), err
	}
	for _, status := range info.DriverStatus {
		if len(status) == 2 && status[0] == "driver-type" && status[1] == "io.containerd.snapshotter.v1" {
			bytes, err := measureSelected(ctx, client, selected)
			return bytes, len(selected), err
		}
	}
	return 0, len(selected), errors.New("isolated image accounting requires containerd on shared Docker hosts")
}

func isOwned(image summary, commits map[string]bool) bool {
	if commits[image.Labels["io.hy2-panel.commit"]] {
		return true
	}
	for _, tag := range image.Tags {
		tag = strings.TrimPrefix(tag, "docker.io/library/")
		if strings.HasPrefix(tag, "hy2-panel:") && commits[strings.TrimPrefix(tag, "hy2-panel:")] {
			return true
		}
	}
	return false
}
