package multicore_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMultipleSubscriptionConnections(t *testing.T) {
	app := testutil.New(t)
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"🚀 Phone"}`))
	var user users.User
	json.Unmarshal(created.Body.Bytes(), &user)
	user, _ = app.Users.User(user.ID)
	app.Subscriptions.Sources = func() ([]subscriptions.Profile, error) {
		settings, err := app.Config.Get()
		if err != nil {
			return nil, err
		}
		extra := settings
		extra.Port = "8444"
		native := configuration.Settings{AuthMode: "native"}
		return []subscriptions.Profile{{ID: "default", Name: "First", Settings: settings}, {ID: "extra", Name: "Second", Settings: extra}, {ID: "native", Settings: native}}, nil
	}
	request := testutil.Request("GET", "/sub/"+user.Token, "")
	request.SetPathValue("token", user.Token)
	result := httptest.NewRecorder()
	app.Subscriptions.Serve(result, request)
	decoded, err := base64.StdEncoding.DecodeString(result.Body.String())
	if err != nil || result.Code != 200 {
		t.Fatal(result.Body.String(), err)
	}
	lines := strings.Split(strings.TrimSpace(string(decoded)), "\n")
	if len(lines) != 2 || !strings.Contains(lines[0], ":8443") || !strings.Contains(lines[1], ":8444") {
		t.Fatal(string(decoded))
	}
	linkRequest := testutil.Request("GET", "/links", "")
	linkRequest.SetPathValue("id", user.ID)
	links := httptest.NewRecorder()
	app.Subscriptions.Links(links, linkRequest)
	var response struct {
		URI         string
		Connections []subscriptions.Connection
	}
	if err := json.Unmarshal(links.Body.Bytes(), &response); err != nil || len(response.Connections) != 2 || response.URI != response.Connections[0].URI {
		t.Fatal(links.Body.String())
	}
}
