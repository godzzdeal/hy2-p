package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/buildinfo/updates"
	"hy2-panel/internal/portcontrol/protocol"
	"io"
	"net/http"
	"runtime"
	"time"
)

func New() *Service { return &Service{HTTP: updates.New("").HTTP} }
func (service *Service) List(ctx context.Context) ([]Version, error) {
	service.mu.Lock()
	defer service.mu.Unlock()
	if time.Now().Before(service.next) {
		return append([]Version{}, service.cached...), service.err
	}
	service.cached, service.err = service.fetch(ctx)
	service.next = time.Now().Add(CacheDuration)
	return append([]Version{}, service.cached...), service.err
}
func (service *Service) fetch(ctx context.Context) ([]Version, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, Endpoint, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("User-Agent", "HY2-P")
	request.Header.Set("Accept", "application/vnd.github+json")
	response, err := service.HTTP.Do(request)
	if err != nil {
		return nil, errors.New("Не удалось загрузить версии панели с GitHub")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, errors.New("GitHub временно недоступен. Повторите проверку позже")
	}
	var releases []release
	if err = json.NewDecoder(io.LimitReader(response.Body, MaxResponse)).Decode(&releases); err != nil {
		return nil, err
	}
	result := []Version{}
	for _, release := range releases {
		if available(release) {
			result = append(result, Version{Version: release.Tag, Published: release.Published})
		}
	}
	return result, nil
}
func available(value release) bool {
	if value.Draft || value.Prerelease || !protocol.PanelVersionPattern.MatchString(value.Tag) {
		return false
	}
	archive := "hy2-panel-linux-" + runtime.GOARCH + ".tar.gz"
	hasImage, hasChecksum := false, false
	for _, asset := range value.Assets {
		if asset.Name == archive {
			hasImage = true
		}
		if asset.Name == archive+".sha256" {
			hasChecksum = true
		}
	}
	return hasImage && hasChecksum
}
