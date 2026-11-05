package releases

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const RequestTimeout = 2 * time.Minute

type Client struct{ HTTP *http.Client }

func New() *Client {
	return &Client{HTTP: &http.Client{Timeout: RequestTimeout, CheckRedirect: checkRedirect}}
}
func checkRedirect(request *http.Request, previous []*http.Request) error {
	if len(previous) >= 5 {
		return errors.New("слишком много перенаправлений")
	}
	host := request.URL.Hostname()
	if request.URL.Scheme != "https" || (host != "api.github.com" && host != "github.com" && host != "release-assets.githubusercontent.com" && host != "objects.githubusercontent.com") {
		return errors.New("недоверенный адрес загрузки")
	}
	return nil
}
func (client *Client) get(ctx context.Context, address string) (*http.Response, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, address, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("User-Agent", "HY2-Control")
	request.Header.Set("Accept", "application/vnd.github+json")
	response, err := client.HTTP.Do(request)
	if err != nil {
		return nil, err
	}
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		return nil, fmt.Errorf("GitHub: HTTP %d. Проверьте доступ к сети и лимит запросов", response.StatusCode)
	}
	return response, nil
}
func (client *Client) metadata(ctx context.Context, address string, target any) error {
	response, err := client.get(ctx, address)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	decoder := json.NewDecoder(io.LimitReader(response.Body, MaxMetadataSize))
	return decoder.Decode(target)
}
func (client *Client) List(ctx context.Context) ([]Version, error) {
	var releases []Release
	if err := client.metadata(ctx, API+"?per_page=30", &releases); err != nil {
		return nil, err
	}
	versions := []Version{}
	for _, release := range releases {
		if release.Draft || release.Prerelease || !VersionPattern.MatchString(release.Tag) {
			continue
		}
		_, available := assetFor(release)
		versions = append(versions, Version{release.Tag, release.Published, available})
	}
	return versions, nil
}
func (client *Client) Resolve(ctx context.Context, tag string) (Asset, error) {
	if !VersionPattern.MatchString(tag) {
		return Asset{}, errors.New("некорректная версия")
	}
	var release Release
	if err := client.metadata(ctx, API+"/tags/"+url.PathEscape(tag), &release); err != nil {
		return Asset{}, err
	}
	if release.Draft || release.Prerelease || release.Tag != tag {
		return Asset{}, errors.New("доступны только стабильные релизы Hysteria2")
	}
	asset, ok := assetFor(release)
	if !ok {
		return Asset{}, errors.New("для этой платформы нет файла с SHA-256")
	}
	if !strings.HasPrefix(asset.URL, "https://github.com/HyNetworks/hysteria/releases/download/") {
		return Asset{}, errors.New("неофициальный адрес файла")
	}
	return asset, nil
}
