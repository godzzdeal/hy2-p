package useraccess_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/core"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/useraccess/integration"
	"hy2-panel/internal/users"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fixture struct {
	app      *testutil.Application
	registry *instances.Registry
	access   *integration.Handler
	user     users.User
	extra    string
	mux      *http.ServeMux
}

func setup(t *testing.T) fixture {
	t.Helper()
	t.Setenv("HYSTERIA_BIN", "missing-test-hysteria")
	app := testutil.New(t)
	data := t.TempDir()
	runtime, err := core.New(app.DB, app.Config, data, "fixture-secret")
	if err != nil {
		t.Fatal(err)
	}
	registry, err := instances.Open(context.Background(), data, app.DB, app.Users.Vault, app.Config, runtime)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(registry.Close)
	settings, err := app.Config.Get()
	if err != nil {
		t.Fatal(err)
	}
	settings.Port = "8444"
	settings.Config = strings.ReplaceAll(settings.Config, "8443", "8444")
	extra, err := registry.Add("Second", settings)
	if err != nil {
		t.Fatal(err)
	}
	access, err := integration.Open(data, registry, app.Users)
	if err != nil {
		t.Fatal(err)
	}
	app.Subscriptions.Sources = instanceapi.Profiles(registry)
	app.Subscriptions.AllowCore = access.Store.Allows
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"Phone"}`))
	var user users.User
	if err := json.Unmarshal(created.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	user, err = app.Users.User(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users/{id}/cores", access.Read)
	mux.HandleFunc("PUT /users/{id}/cores", access.Save)
	mux.HandleFunc("POST /auth", access.Authenticate)
	mux.HandleFunc("POST /auth/{instance}", access.Authenticate)
	return fixture{app, registry, access, user, extra.ID, mux}
}
func send(handler http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	encoded, _ := json.Marshal(body)
	result := httptest.NewRecorder()
	handler.ServeHTTP(result, testutil.Request(method, path, string(encoded)))
	return result
}
