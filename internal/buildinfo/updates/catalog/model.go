package catalog

import (
	"net/http"
	"sync"
	"time"
)

const Endpoint = "https://api.github.com/repos/godzzdeal/hy2-p/releases?per_page=30"
const MaxResponse = 8 << 20
const CacheDuration = time.Minute

type Version struct {
	Version   string `json:"version"`
	Published string `json:"published"`
}
type release struct {
	Tag        string `json:"tag_name"`
	Published  string `json:"published_at"`
	Draft      bool   `json:"draft"`
	Prerelease bool   `json:"prerelease"`
	Assets     []struct {
		Name string `json:"name"`
	} `json:"assets"`
}
type Service struct {
	HTTP   *http.Client
	mu     sync.Mutex
	next   time.Time
	cached []Version
	err    error
}
