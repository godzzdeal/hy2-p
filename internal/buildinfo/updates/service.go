package updates

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

const Repository = "https://github.com/godzzdeal/hy2-p"
const LatestAPI = "https://api.github.com/repos/godzzdeal/hy2-p/releases/latest"
const CacheDuration = time.Minute
const RequestTimeout = 8 * time.Second
const MaxResponse = 1 << 20

type Snapshot struct {
	Current     string `json:"current"`
	Latest      string `json:"latest"`
	URL         string `json:"url"`
	State       string `json:"state"`
	PublishedAt string `json:"publishedAt"`
	CheckedAt   string `json:"checkedAt"`
}
type Service struct {
	HTTP    *http.Client
	current string
	mu      sync.Mutex
	next    time.Time
	cached  Snapshot
	err     error
}

func New(current string) *Service {
	return &Service{current: current, HTTP: &http.Client{
		Timeout:       RequestTimeout,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}}
}
func (service *Service) Check(ctx context.Context) (Snapshot, error) {
	service.mu.Lock()
	defer service.mu.Unlock()
	if time.Now().Before(service.next) {
		return service.cached, service.err
	}
	if err := ctx.Err(); err != nil {
		return Snapshot{}, err
	}
	service.cached, service.err = service.fetch(ctx)
	service.next = time.Now().Add(CacheDuration)
	return service.cached, service.err
}
func (service *Service) fetch(ctx context.Context) (Snapshot, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, LatestAPI, nil)
	if err != nil {
		return Snapshot{}, err
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("User-Agent", "HY2-P")
	request.Header.Set("X-GitHub-Api-Version", "2026-03-10")
	response, err := service.HTTP.Do(request)
	if err != nil {
		return Snapshot{}, errors.New("Не удалось связаться с GitHub. Повторите проверку позже")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return Snapshot{}, fmt.Errorf("GitHub временно недоступен или ограничил запросы (HTTP %d). Повторите проверку позже", response.StatusCode)
	}
	var release struct {
		Tag        string `json:"tag_name"`
		Published  string `json:"published_at"`
		Draft      bool   `json:"draft"`
		Prerelease bool   `json:"prerelease"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, MaxResponse)).Decode(&release); err != nil {
		return Snapshot{}, errors.New("GitHub вернул некорректные данные релиза")
	}
	if release.Draft || release.Prerelease || !stableVersion.MatchString(release.Tag) {
		return Snapshot{}, errors.New("Не найден опубликованный стабильный релиз HY2-P")
	}
	return Snapshot{Current: service.current, Latest: release.Tag, URL: Repository + "/releases/tag/" + release.Tag,
		State: versionState(service.current, release.Tag), PublishedAt: release.Published, CheckedAt: time.Now().UTC().Format(time.RFC3339)}, nil
}
