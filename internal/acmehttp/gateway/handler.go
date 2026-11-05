package gateway

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/configuration"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const ProxyTimeout = 2 * time.Second
const RequestTimeout = 10 * time.Second
const MaxProxyConnections = 16

var tokenPattern = regexp.MustCompile("^[A-Za-z0-9_-]{1,256}$")

type Handler struct {
	Web, Core http.Handler
	Allowed   func(string) bool
}

func (handler Handler) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	token := strings.TrimPrefix(request.URL.Path, acmehttp.TokenPrefix)
	if !strings.HasPrefix(request.URL.Path, acmehttp.TokenPrefix) || !tokenPattern.MatchString(token) ||
		(request.Method != http.MethodGet && request.Method != http.MethodHead) || request.ContentLength != 0 {
		http.NotFound(writer, request)
		return
	}
	buffered := newBuffer()
	handler.Web.ServeHTTP(buffered, request)
	if (buffered.status == http.StatusNotFound || buffered.status == http.StatusForbidden) && handler.Allowed != nil && handler.Core != nil && handler.Allowed(request.Host) {
		handler.Core.ServeHTTP(writer, request)
		return
	}
	buffered.flush(writer)
}
func Server(host string, port int, web *http.Server, config *configuration.Handler) *http.Server {
	backend := &url.URL{Scheme: "http", Host: net.JoinHostPort("127.0.0.1", strconv.Itoa(acmehttp.CorePort))}
	proxy := httputil.NewSingleHostReverseProxy(backend)
	proxy.Transport = &http.Transport{DialContext: (&net.Dialer{Timeout: ProxyTimeout}).DialContext, ResponseHeaderTimeout: ProxyTimeout, MaxConnsPerHost: MaxProxyConnections, MaxResponseHeaderBytes: MaxTokenResponse}
	proxy.ErrorHandler = func(writer http.ResponseWriter, request *http.Request, err error) {
		http.Error(writer, "ACME challenge unavailable", http.StatusBadGateway)
	}
	webHandler := http.NotFoundHandler()
	if web != nil {
		webHandler = web.Handler
	}
	allowed := func(host string) bool {
		if name, _, err := net.SplitHostPort(host); err == nil {
			host = name
		}
		settings, err := config.Get()
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
	handler := Handler{Web: webHandler, Core: proxy, Allowed: allowed}
	if web != nil {
		web.Handler = handler
		web.ReadTimeout = RequestTimeout
		web.WriteTimeout = RequestTimeout
		return web
	}
	return &http.Server{Addr: net.JoinHostPort(host, strconv.Itoa(port)), Handler: handler, ReadHeaderTimeout: ProxyTimeout, ReadTimeout: RequestTimeout, WriteTimeout: 5 * ProxyTimeout}
}
