package instances_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/profiles"
	"hy2-panel/internal/core"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func settings(port string) configuration.Settings {
	return configuration.Settings{Host: "vpn.example.org", Port: port, SNI: "vpn.example.org", AuthMode: "panel", Config: "listen: :" + port + "\ntls:\n  cert: /certs/test.crt\n  key: /certs/test.key\n"}
}
func openRegistry(t *testing.T, data string) *instances.Registry {
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
	registry, err := instances.Open(context.Background(), data, nil, vault, config, runtime)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(registry.Close)
	return registry
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
