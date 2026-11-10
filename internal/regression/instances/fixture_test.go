package instances_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/profiles"
	"hy2-panel/internal/core"
	"hy2-panel/internal/core/watchdog"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func settings(port string) configuration.Settings {
	return configuration.Settings{Host: "vpn.example.org", Port: port, SNI: "vpn.example.org", AuthMode: "panel", Config: "listen: :" + port + "\ntls:\n  cert: /certs/test.crt\n  key: /certs/test.key\n"}
}
func openRegistry(t *testing.T, data string, monitor ...*watchdog.Monitor) *instances.Registry {
	t.Helper()
	vault, err := cryptovault.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	config := &configuration.Handler{Vault: vault, Profile: &profiles.Store{Directory: filepath.Join(data, "main"), Vault: vault}}
	if _, err := config.Get(); err != nil {
		if err := config.Profile.Put(settings("8443")); err != nil {
			t.Fatal(err)
		}
	}
	runtime, err := core.New(nil, config, data, "fixture-secret")
	if err != nil {
		t.Fatal(err)
	}
	if len(monitor) > 0 {
		runtime.Watchdog = monitor[0]
	}
	registry, err := instances.Open(context.Background(), data, nil, vault, config, runtime)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(registry.Close)
	return registry
}

type pausedRuntime struct {
	entered, release chan struct{}
	once             sync.Once
}

func (runtime *pausedRuntime) Version() string {
	runtime.once.Do(func() { close(runtime.entered) })
	<-runtime.release
	return "test"
}
func (*pausedRuntime) Running() bool                 { return false }
func (*pausedRuntime) TryLock() bool                 { return false }
func (*pausedRuntime) Unlock()                       {}
func (*pausedRuntime) Restart(context.Context) error { return nil }
func (*pausedRuntime) Recover(context.Context) error { return nil }

func TestCloseWaitsForMonitorExit(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	runtime := &pausedRuntime{entered: make(chan struct{}), release: make(chan struct{})}
	monitor := watchdog.New(runtime, watchdog.DefaultPolicy())
	registry := openRegistry(t, t.TempDir(), monitor)
	t.Cleanup(func() {
		select {
		case <-runtime.release:
		default:
			close(runtime.release)
		}
	})
	monitor.NotifyExit()
	const timeout = 5 * time.Second
	select {
	case <-runtime.entered:
	case <-time.After(timeout):
		t.Fatal("monitor did not enter its controlled check")
	}
	closed := make(chan struct{})
	go func() { registry.Close(); close(closed) }()
	select {
	case <-closed:
		t.Fatal("registry closed while its monitor was still running")
	case <-time.After(25 * time.Millisecond):
	}
	close(runtime.release)
	select {
	case <-closed:
	case <-time.After(timeout):
		t.Fatal("registry did not finish after monitor exit")
	}
	registry.Close()
}
func routes(registry *instances.Registry) *http.ServeMux {
	mux := http.NewServeMux()
	instanceapi.Register(mux, registry, func(handler http.HandlerFunc) http.HandlerFunc { return handler })
	return mux
}
func request(handler http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	data, _ := json.Marshal(body)
	result := httptest.NewRecorder()
	handler.ServeHTTP(result, httptest.NewRequest(method, path, strings.NewReader(string(data))))
	return result
}
