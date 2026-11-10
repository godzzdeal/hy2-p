package images

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"sync"
)

const maxWorkers = 4

// For each prefix, only add the newest image's bytes not shared with earlier images.
// containerd calculates SharedSize against the filtered set, so each blob and snapshot
// is counted once even when three or more images share different combinations of layers.
func measureSelected(ctx context.Context, client *http.Client, images []summary) (uint64, error) {
	results := make([]uint64, len(images))
	failures := make([]error, len(images))
	work := make(chan int, len(images))
	for index := range images {
		work <- index
	}
	close(work)
	var workers sync.WaitGroup
	for range min(maxWorkers, len(images)) {
		workers.Go(func() {
			for index := range work {
				results[index], failures[index] = addedBytes(ctx, client, images[:index+1])
			}
		})
	}
	workers.Wait()
	var total uint64
	for _, bytes := range results {
		total += bytes
	}
	return total, errors.Join(failures...)
}

func addedBytes(ctx context.Context, client *http.Client, images []summary) (uint64, error) {
	references := make([]string, len(images))
	for index, image := range images {
		// A canonical tag also lets the daemon exclude unrelated images entirely.
		if len(image.Tags) == 0 {
			return 0, errors.New("untagged image cannot be isolated")
		}
		references[index] = image.Tags[0]
	}
	filters, err := json.Marshal(map[string][]string{"reference": references})
	if err != nil {
		return 0, err
	}
	var summaries []summary
	if err := readJSON(ctx, client, "/images/json?shared-size=true&filters="+url.QueryEscape(string(filters)), &summaries); err != nil {
		return 0, err
	}
	target := images[len(images)-1].ID
	for _, image := range summaries {
		if image.ID == target && image.SharedSize >= 0 && image.Size >= image.SharedSize {
			return uint64(image.Size - image.SharedSize), nil
		}
	}
	return 0, errors.New("Docker image changed during storage scan")
}
