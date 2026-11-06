package devices_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/devices/integration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

type fixture struct {
	app     *testutil.Application
	handler *integration.Handler
	user    users.User
	mux     *http.ServeMux
}

func setup(t *testing.T) fixture {
	t.Helper()
	app := testutil.New(t)
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"Phone"}`))
	var user users.User
	json.Unmarshal(created.Body.Bytes(), &user)
	user, err := app.Users.User(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	handler, err := integration.Open(t.TempDir(), app.Users, func(string) {})
	if err != nil {
		t.Fatal(err)
	}
	app.Subscriptions.DeviceLimit = handler.Store.Limit
	app.Subscriptions.PrepareSubscription = handler.Prepare
	app.Subscriptions.Sources = func() ([]subscriptions.Profile, error) {
		main, err := app.Config.Get()
		if err != nil {
			return nil, err
		}
		extra := main
		extra.Port = "8444"
		return []subscriptions.Profile{{ID: "default", Name: "Main", Settings: main}, {ID: "bbbbbbbbbbbbbbbb", Name: "Second", Settings: extra}}, nil
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users/{id}/devices", handler.Read)
	mux.HandleFunc("PUT /users/{id}/devices", handler.SetLimit)
	mux.HandleFunc("PATCH /users/{id}/devices/{device}", handler.Edit)
	return fixture{app, handler, user, mux}
}
func (fixture fixture) subscription(hwid string) *httptest.ResponseRecorder {
	request := testutil.Request("GET", "/sub/"+fixture.user.Token, "")
	request.SetPathValue("token", fixture.user.Token)
	request.RemoteAddr = "198.51.100.1:1234"
	request.Header.Set("x-hwid", hwid)
	request.Header.Set("x-device-model", "iPhone fixture")
	request.Header.Set("x-device-os", "iOS")
	request.Header.Set("x-ver-os", "18")
	request.Header.Set("User-Agent", "Happ/fixture")
	response := httptest.NewRecorder()
	fixture.app.Subscriptions.Serve(response, request)
	return response
}
func secret(t *testing.T, response *httptest.ResponseRecorder) string {
	t.Helper()
	body, err := base64.StdEncoding.DecodeString(response.Body.String())
	if err != nil || response.Code != 200 {
		t.Fatal(response.Code, response.Body.String())
	}
	uri, err := url.Parse(strings.Split(string(body), "\n")[0])
	if err != nil {
		t.Fatal(err)
	}
	return uri.User.Username()
}
func (fixture fixture) authenticate(password string) *httptest.ResponseRecorder {
	request := testutil.Request("POST", "/auth", `{"auth":"`+password+`","addr":"203.0.113.4:4567"}`)
	response := httptest.NewRecorder()
	fixture.app.Users.AuthenticateFor("default")(response, request)
	return response
}

func TestDeviceOnlineStatusTracksSourcesAndUnavailability(t *testing.T) {
	fixture := setup(t)
	password := secret(t, fixture.subscription("device-00000001"))
	response := fixture.authenticate(password)
	var authenticated struct{ ID string }
	json.Unmarshal(response.Body.Bytes(), &authenticated)
	store := fixture.handler.Store
	store.Sources([]string{"first", "second"})
	store.Observe("first", map[string]int{authenticated.ID: 1}, true)
	store.Observe("second", map[string]int{authenticated.ID: 1}, true)
	device := store.Snapshot(fixture.user.ID).Devices[0]
	if device.Online != 2 || !device.StatusAvailable {
		t.Fatal(device)
	}
	store.Sources([]string{"first"})
	if store.Snapshot(fixture.user.ID).Devices[0].Online != 1 {
		t.Fatal("retired source stayed online")
	}
	store.Observe("first", nil, false)
	if store.Snapshot(fixture.user.ID).Devices[0].StatusAvailable {
		t.Fatal("unavailable statistics reported as known")
	}
	store.Sources(nil)
	device = store.Snapshot(fixture.user.ID).Devices[0]
	if device.Online != 0 || !device.StatusAvailable {
		t.Fatal(device)
	}
}
