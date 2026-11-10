package panelcatalog_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/buildinfo/updates/catalog"
	"io"
	"net/http"
	"runtime"
	"strings"
	"testing"
)

type transport func(*http.Request) (*http.Response, error)

func (run transport) RoundTrip(request *http.Request) (*http.Response, error) { return run(request) }

func TestCatalogOnlyListsPublishedVersionsWithImageAndChecksum(t *testing.T) {
	archive := "hy2-panel-linux-" + runtime.GOARCH + ".tar.gz"
	assets := []map[string]string{{"name": archive}, {"name": archive + ".sha256"}}
	payload, err := json.Marshal([]map[string]any{
		{"tag_name": "v0.7.6", "assets": assets},
		{"tag_name": "v0.7.7", "assets": assets, "draft": true},
		{"tag_name": "v0.8.0", "assets": assets, "prerelease": true},
		{"tag_name": "main", "assets": assets},
		{"tag_name": "v0.7.5", "assets": assets[:1]},
		{"tag_name": "v0.7.4", "assets": assets},
	})
	if err != nil {
		t.Fatal(err)
	}
	calls := 0
	service := &catalog.Service{HTTP: &http.Client{Transport: transport(func(request *http.Request) (*http.Response, error) {
		calls++
		if request.URL.String() != catalog.Endpoint {
			t.Fatal("unexpected remote host")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(string(payload)))}, nil
	})}}
	result, err := service.List(context.Background())
	if err != nil || len(result) != 2 || result[0].Version != "v0.7.6" || result[1].Version != "v0.7.4" {
		t.Fatalf("%+v %v", result, err)
	}
	result[0].Version = "mutated"
	again, err := service.List(context.Background())
	if err != nil || calls != 1 || again[0].Version != "v0.7.6" {
		t.Fatal("cache was refetched or mutated")
	}
}
