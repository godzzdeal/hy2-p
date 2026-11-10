package gateway

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/acmehttp/gateway/backends"
	"net"
	"net/http"
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
	if (buffered.status == http.StatusNotFound || buffered.status == http.StatusForbidden) && handler.Core != nil && (handler.Allowed == nil || handler.Allowed(request.Host)) {
		handler.Core.ServeHTTP(writer, request)
		return
	}
	buffered.flush(writer)
}
func ServerFor(host string, port int, web *http.Server, sources func() []backends.Source) *http.Server {
	webHandler := http.NotFoundHandler()
	if web != nil {
		webHandler = web.Handler
	}
	handler := Handler{Web: webHandler, Core: backends.Handler{Sources: sources}}
	if web != nil {
		web.Handler = handler
		web.ReadTimeout = RequestTimeout
		web.WriteTimeout = RequestTimeout
		return web
	}
	return &http.Server{Addr: net.JoinHostPort(host, strconv.Itoa(port)), Handler: handler, ReadHeaderTimeout: ProxyTimeout, ReadTimeout: RequestTimeout, WriteTimeout: 5 * ProxyTimeout}
}
