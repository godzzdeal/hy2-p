package regression_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"

	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClientRoutingPersistsAndLegacySavesPreserveIt(t *testing.T) {
	directory := t.TempDir()
	store, err := announcement.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	save := func(body string, expected int) {
		t.Helper()
		response := httptest.NewRecorder()
		store.Save(response, httptest.NewRequest("PUT", "/", strings.NewReader(body)))
		if response.Code != expected {
			t.Fatal(response.Code, response.Body.String())
		}
	}
	save(`{"updateInterval":6,"routing":{"enabled":true,"domains":["Example.com"]}}`, 200)
	store, err = announcement.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	if store.Current().Routing.Domains[0] != "example.com" {
		t.Fatal("routing not normalized or persisted")
	}
	copy := store.Current()
	copy.Routing.Domains[0] = "other.example"
	if store.Current().Routing.Domains[0] != "example.com" {
		t.Fatal("settings snapshot can mutate shared routing")
	}
	headers := http.Header{}
	store.Headers(headers)
	original := headers.Get("routing")
	if !strings.HasPrefix(original, "happ://routing/onadd/") {
		t.Fatal(original)
	}
	save(`{"profileTitle":"Changed title","updateInterval":6}`, 200)
	headers = http.Header{}
	store.Headers(headers)
	if headers.Get("routing") != original {
		t.Fatal("unrelated settings changed routing")
	}
	save(`{"updateInterval":6,"routing":{"enabled":true,"domains":["https://example.com"]}}`, 400)
	save(`{"updateInterval":6,"routing":{"enabled":false,"domains":["example.com"]}}`, 200)
	headers = http.Header{}
	store.Headers(headers)
	if headers.Get("routing") != "happ://routing/off" {
		t.Fatal("disable not delivered")
	}
	encoded, _ := json.Marshal(store.Current())
	if !strings.Contains(string(encoded), `"routing"`) {
		t.Fatal("settings API omits routing")
	}

}

func TestClientRoutingMetadataDoesNotChangeSubscriptionURIs(t *testing.T) {
	app := testutil.New(t)
	store, err := announcement.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	app.Subscriptions.Announcements = store
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"Routing test"}`))
	if created.Code != 201 {
		t.Fatal(created.Body.String())
	}
	var user users.User
	if err = json.Unmarshal(created.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	user, err = app.Users.User(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	fetch := func(token, format string) *httptest.ResponseRecorder {
		request := testutil.Request("GET", "/sub/test?format="+format, "")
		request.SetPathValue("token", token)
		response := httptest.NewRecorder()
		app.Subscriptions.Serve(response, request)
		return response
	}
	original := fetch(user.Token, "uri").Body.String()
	saved := httptest.NewRecorder()
	store.Save(saved, testutil.Request("PUT", "/", `{"updateInterval":6,"routing":{"enabled":true,"domains":["example.com"]}}`))
	if saved.Code != 200 {
		t.Fatal(saved.Body.String())
	}
	for _, format := range []string{"uri", "base64"} {
		response := fetch(user.Token, format)
		if response.Code != 200 || response.Header().Get("routing") == "" {
			t.Fatal(response.Code, response.Body.String())
		}
		content := response.Body.String()
		if format == "base64" {
			data, decodeErr := base64.StdEncoding.DecodeString(content)
			if decodeErr != nil {
				t.Fatal(decodeErr)
			}
			content = string(data)
		}
		if content != original {
			t.Fatal("routing modified ordinary connection links")
		}
	}
	denied := fetch("invalid", "uri")
	if denied.Code != 404 || denied.Header().Get("routing") != "" {
		t.Fatal("routing metadata exposed without a valid subscription")
	}
}
