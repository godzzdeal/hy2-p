package backends

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/configuration"
	"net"
	"net/http"
	"strings"
	"time"
)

const Timeout = 2 * time.Second
const MaxResponse = 4096

type Source struct {
	Config *configuration.Handler
	Port   int
}
type Handler struct{ Sources func() []Source }
type response struct {
	body   []byte
	status int
}

var client = &http.Client{
	Timeout:       Timeout,
	Transport:     &http.Transport{Proxy: nil, DialContext: (&net.Dialer{Timeout: Timeout}).DialContext, ResponseHeaderTimeout: Timeout, MaxConnsPerHost: 16, MaxResponseHeaderBytes: MaxResponse},
	CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
}

func matches(source Source, host string) bool {
	if hostname, _, err := net.SplitHostPort(host); err == nil {
		host = hostname
	}
	settings, err := source.Config.Get()
	if err != nil {
		return false
	}
	domains, err := acmehttp.Domains(settings.Config)
	if err != nil {
		return false
	}
	for _, domain := range domains {
		if strings.EqualFold(strings.TrimSuffix(domain, "."), strings.TrimSuffix(host, ".")) {
			return true
		}
	}
	return false
}
