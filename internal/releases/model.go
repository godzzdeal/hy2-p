package releases

import (
	"context"
	"fmt"
	"regexp"
	"runtime"
	"strings"
)

const API = "https://api.github.com/repos/HyNetworks/hysteria/releases"
const MaxBinarySize int64 = 128 << 20
const MaxMetadataSize int64 = 8 << 20

var VersionPattern = regexp.MustCompile(`^app/v2\.[0-9]+\.[0-9]+$`)

type Asset struct {
	Name   string `json:"name"`
	URL    string `json:"browser_download_url"`
	Digest string `json:"digest"`
	Size   int64  `json:"size"`
}
type Release struct {
	Tag        string  `json:"tag_name"`
	Published  string  `json:"published_at"`
	Prerelease bool    `json:"prerelease"`
	Draft      bool    `json:"draft"`
	Assets     []Asset `json:"assets"`
}
type Version struct {
	Tag       string `json:"tag"`
	Published string `json:"published"`
	Available bool   `json:"available"`
}
type Source interface {
	List(context.Context) ([]Version, error)
	Resolve(context.Context, string) (Asset, error)
	Download(context.Context, Asset, string) (string, error)
}

func AssetName() string {
	extension := ""
	if runtime.GOOS == "windows" {
		extension = ".exe"
	}
	return fmt.Sprintf("hysteria-%s-%s%s", runtime.GOOS, runtime.GOARCH, extension)
}
func assetFor(release Release) (Asset, bool) {
	for _, asset := range release.Assets {
		if asset.Name == AssetName() && strings.HasPrefix(asset.Digest, "sha256:") && len(asset.Digest) == 71 && asset.Size > 0 && asset.Size <= MaxBinarySize {
			return asset, true
		}
	}
	return Asset{}, false
}
