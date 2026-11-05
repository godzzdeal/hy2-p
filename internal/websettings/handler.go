package websettings

import (
	"hy2-panel/internal/records"
	"hy2-panel/internal/transport"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
)

type Handler struct {
	mu        sync.RWMutex
	config    Config
	active    Config
	directory string
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
