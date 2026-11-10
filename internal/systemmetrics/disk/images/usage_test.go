package images

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestUsageCountsSharedStorageOnceAndExcludesOtherApplications(t *testing.T) {
	commits := []string{strings.Repeat("a", 40), strings.Repeat("b", 40), strings.Repeat("c", 40)}
	for _, scenario := range []struct {
		name       string
		isMixed    bool
		isLegacy   bool
		shouldFail bool
	}{
		{name: "dedicated containerd"}, {name: "shared containerd", isMixed: true},
		{name: "dedicated legacy", isLegacy: true},
		{name: "shared legacy reports unavailable instead of inflated sum", isMixed: true, isLegacy: true, shouldFail: true},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			root := t.TempDir()
			for _, commit := range commits {
				if err := os.MkdirAll(filepath.Join(root, "releases", commit), 0700); err != nil {
					t.Fatal(err)
				}
			}
			layers := map[string]int64{"base": 10, "ab": 20, "a": 30, "b": 40, "c": 50, "foreign": 1000}
			imageLayers := [][]string{{"base", "ab", "a"}, {"base", "ab", "b"}, {"base", "c"}}
			if scenario.isMixed {
				imageLayers = append(imageLayers, []string{"base", "foreign"})
			}
			images := make([]summary, len(imageLayers))
			for index, keys := range imageLayers {
				images[index] = summary{ID: "sha256:" + strings.Repeat(string(rune('a'+index)), 64)}
				if index < len(commits) {
					images[index].Tags = []string{"hy2-panel:" + commits[index]}
				} else {
					images[index].Tags = []string{"other-app:latest"}
				}
				for _, key := range keys {
					images[index].Size += layers[key]
				}
			}
			handler := http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
				switch request.URL.Path {
				case "/system/df":
					total := int64(150)
					if scenario.isMixed {
						total += 1000
					}
					json.NewEncoder(writer).Encode(map[string]any{"LayersSize": total, "Images": images})
				case "/info":
					driver := "io.containerd.snapshotter.v1"
					if scenario.isLegacy {
						driver = "overlay2"
					}
					json.NewEncoder(writer).Encode(map[string]any{"DriverStatus": [][]string{{"driver-type", driver}}})
				case "/images/json":
					var filters map[string][]string
					if json.Unmarshal([]byte(request.URL.Query().Get("filters")), &filters) != nil {
						writer.WriteHeader(http.StatusBadRequest)
						return
					}
					counts := make(map[string]int)
					for index, image := range images {
						if slices.Contains(filters["reference"], image.Tags[0]) {
							for _, key := range imageLayers[index] {
								counts[key]++
							}
						}
					}
					selected := []summary{}
					for index, image := range images {
						if !slices.Contains(filters["reference"], image.Tags[0]) {
							continue
						}
						for _, key := range imageLayers[index] {
							if counts[key] > 1 {
								image.SharedSize += layers[key]
							}
						}
						selected = append(selected, image)
					}
					json.NewEncoder(writer).Encode(selected)
				default:
					writer.WriteHeader(http.StatusNotFound)
				}
			})
			client := &http.Client{Transport: handlerTransport{handler: handler}}
			bytes, count, err := measure(t.Context(), client, root)
			if scenario.shouldFail {
				if err == nil || bytes != 0 {
					t.Fatalf("unsupported accounting marked valid: %d %v", bytes, err)
				}
			} else if err != nil || bytes != 150 || count != 3 {
				t.Fatalf("wrong union: bytes=%d count=%d error=%v", bytes, count, err)
			}
		})
	}
}

type handlerTransport struct {
	handler http.Handler
}

func (transport handlerTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	response := httptest.NewRecorder()
	transport.handler.ServeHTTP(response, request)
	return response.Result(), nil
}
