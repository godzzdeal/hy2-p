package websettings

import (
	"hy2-panel/internal/records"
	"hy2-panel/internal/transport"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

type Handler struct {
	mu        sync.RWMutex
	config    Config
	active    Config
	directory string
	closeTLS  func()
}

func (handler *Handler) Close() {
	if handler.closeTLS != nil {
		handler.closeTLS()
	}
}

func Open(data, listen, publicURL string) (*Handler, error) {
	host, port, err := net.SplitHostPort(listen)
	if err != nil {
		return nil, err
	}
	if host == "" {
		host = "0.0.0.0"
	}
	number, err := strconv.Atoi(port)
	if err != nil {
		return nil, err
	}
	handler := &Handler{directory: filepath.Join(data, "web"), config: Config{Host: host, Port: number, Mode: "http", ChallengePort: 9080, PublicURL: publicURL}}
	err = records.Read(handler.directory, "web", &handler.config)
	if os.IsNotExist(err) {
		handler.config, err = environment(handler.config)
	}
	if err != nil {
		return nil, err
	}
	if err = Validate(handler.config); err != nil {
		return nil, err
	}
	handler.active = handler.config
	return handler, nil
}
func (handler *Handler) Active() Config {
	handler.mu.RLock()
	defer handler.mu.RUnlock()
	return handler.active
}
func (handler *Handler) Current() Config {
	handler.mu.RLock()
	defer handler.mu.RUnlock()
	return handler.config
}
func (handler *Handler) response() map[string]any {
	config := handler.Current()
	hasKey := config.PrivateKey != ""
	restartRequired := config != handler.Active()
	config.PrivateKey = ""
	return map[string]any{"config": config, "hasPrivateKey": hasKey, "restartRequired": restartRequired, "container": os.Getenv("PANEL_CONTAINER") == "true", "activeURL": handler.Active().URL()}
}
func (handler *Handler) Read(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, handler.response())
}
func (handler *Handler) Save(writer http.ResponseWriter, request *http.Request) {
	var config Config
	if err := transport.Decode(writer, request, &config); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	handler.mu.Lock()
	config.PublicURL = PublicAddress(config, request.Host)
	if config.PrivateKey == "" {
		config.PrivateKey = handler.config.PrivateKey
	}
	if err := Validate(config); err != nil {
		handler.mu.Unlock()
		transport.Fail(writer, err, 400)
		return
	}
	if err := records.Write(handler.directory, "web", config); err != nil {
		handler.mu.Unlock()
		transport.Fail(writer, err, 500)
		return
	}
	handler.config = config
	handler.mu.Unlock()
	transport.Respond(writer, handler.response())
}

// PublicAddress preserves the external hostname when the API is behind the frontend proxy.
func PublicAddress(config Config, requestHost string) string {
	host := config.Domain
	if host == "" {
		if address, err := url.Parse(config.PublicURL); err == nil && address.Hostname() != "" {
			host = address.Hostname()
		}
	}
	if host == "" {
		host = requestHost
		if parsed, _, err := net.SplitHostPort(host); err == nil {
			host = parsed
		}
	}
	host = strings.Trim(host, "[]")
	scheme := "http"
	if config.Mode != "http" {
		scheme = "https"
	}
	return (&url.URL{Scheme: scheme, Host: net.JoinHostPort(host, strconv.Itoa(config.Port))}).String()
}
