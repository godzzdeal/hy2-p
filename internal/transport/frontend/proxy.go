package frontend

import (
	"errors"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

const healthTimeout = 2 * time.Second

type Client struct {
	address string
	proxy   http.Handler
}

func New(address string) (*Client, error) {
	client := &Client{address: address}
	if address == "" {
		client.proxy = http.HandlerFunc(unavailable)
		return client, nil
	}
	target, err := url.Parse(address)
	if err != nil || (target.Scheme != "http" && target.Scheme != "https") || target.Host == "" ||
		target.User != nil || target.RawQuery != "" || target.Fragment != "" || (target.Path != "" && target.Path != "/") {
		return nil, errors.New("PANEL_FRONTEND_URL must be an HTTP origin")
	}
	client.proxy = &httputil.ReverseProxy{
		Rewrite: func(request *httputil.ProxyRequest) {
			request.SetURL(target)
			request.SetXForwarded()
			request.Out.Host = request.In.Host
		},
		ErrorHandler: func(writer http.ResponseWriter, request *http.Request, err error) {
			log.Printf("frontend proxy: %v", err)
			unavailable(writer, request)
		},
	}
	return client, nil
}

func (client *Client) Handler() http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		// Next supplies the nonce CSP and cache policy for its HTML and assets.
		writer.Header().Del("Content-Security-Policy")
		writer.Header().Del("Cache-Control")
		client.proxy.ServeHTTP(writer, request)
	})
}

func unavailable(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Cache-Control", "no-store")
	writer.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
	http.Error(writer, "Веб-интерфейс временно недоступен", http.StatusServiceUnavailable)
}
