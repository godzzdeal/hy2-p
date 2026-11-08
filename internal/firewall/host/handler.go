package host

import (
	"context"
	"errors"
	"hy2-panel/internal/firewall"
	"hy2-panel/internal/firewall/host/command"
	"hy2-panel/internal/transport"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const RequestTimeout = 20 * time.Second
const HeaderTimeout = 5 * time.Second
const WriteTimeout = 25 * time.Second

type Service struct {
	Root    string
	Execute func(context.Context, string, ...string) (string, error)
	mu      sync.Mutex
}

func New(root string) (*Service, error) {
	if err := validateRoot(root); err != nil {
		return nil, err
	}
	return &Service{Root: root, Execute: command.Run}, nil
}
func (service *Service) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	if request.URL.Path != "/firewall" || (request.Method != "GET" && request.Method != "POST") {
		transport.Fail(writer, errors.New("Маршрут не найден"), 404)
		return
	}
	ctx, cancel := context.WithTimeout(request.Context(), RequestTimeout)
	defer cancel()
	service.mu.Lock()
	defer service.mu.Unlock()
	var result Result
	var err error
	if request.Method == "POST" {
		var change firewall.Change
		request.Body = http.MaxBytesReader(writer, request.Body, 1024)
		if err = transport.Decode(writer, request, &change); err == nil {
			result, err = service.Change(ctx, change)
		}
	} else {
		result, err = service.Status(ctx)
	}
	if err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	writer.Header().Set("Cache-Control", "no-store")
	transport.Respond(writer, result)
}
func (service *Service) Serve(ctx context.Context) error {
	socket := filepath.Join(service.Root, "firewall", "control.sock")
	if info, err := os.Lstat(socket); err == nil {
		if info.Mode()&os.ModeSocket == 0 {
			return errors.New("firewall socket path is not a socket")
		}
		if err := os.Remove(socket); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	listener, err := net.Listen("unix", socket)
	if err != nil {
		return err
	}
	defer listener.Close()
	if err := os.Chmod(socket, 0600); err != nil {
		return err
	}
	server := &http.Server{Handler: service, ReadHeaderTimeout: HeaderTimeout, ReadTimeout: HeaderTimeout, WriteTimeout: WriteTimeout, IdleTimeout: HeaderTimeout}
	result := make(chan error, 1)
	go func() { result <- server.Serve(listener) }()
	select {
	case err := <-result:
		return err
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), HeaderTimeout)
		defer cancel()
		return server.Shutdown(shutdown)
	}
}
