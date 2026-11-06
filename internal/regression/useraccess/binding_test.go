package useraccess_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/useraccess"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAuthenticationAndSubscriptionUseSameCorePermissions(t *testing.T) {
	fixture := setup(t)
	path := "/users/" + fixture.user.ID + "/cores"
	body := map[string]string{"auth": fixture.user.Password}
	check := func(core string, want bool) {
		t.Helper()
		response := send(fixture.mux, "POST", "/auth/"+core, body)
		var result struct {
			OK bool `json:"ok"`
		}
		json.Unmarshal(response.Body.Bytes(), &result)
		if result.OK != want {
			t.Fatalf("core %s: %s", core, response.Body.String())
		}
	}
	check("default", true)
	check(fixture.extra, true)
	policy := useraccess.Policy{Mode: useraccess.Selected, Instances: []string{fixture.extra}}
	if response := send(fixture.mux, "PUT", path, policy); response.Code != 200 {
		t.Fatal(response.Body.String())
	}
	check("default", false)
	check(fixture.extra, true)
	check("ffffffffffffffff", false)
	response := send(fixture.mux, "POST", "/auth", body)
	if strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal("legacy callback bypass")
	}
	request := testutil.Request("GET", "/sub/"+fixture.user.Token, "")
	request.SetPathValue("token", fixture.user.Token)
	subscription := httptest.NewRecorder()
	fixture.app.Subscriptions.Serve(subscription, request)
	raw, err := base64.StdEncoding.DecodeString(subscription.Body.String())
	if err != nil || strings.Contains(string(raw), ":8443") || !strings.Contains(string(raw), ":8444") {
		t.Fatal("hidden core exported", subscription.Body.String())
	}
	request = testutil.Request("GET", "/links", "")
	request.SetPathValue("id", fixture.user.ID)
	links := httptest.NewRecorder()
	fixture.app.Subscriptions.Links(links, request)
	var result struct{ Connections []subscriptions.Connection }
	json.Unmarshal(links.Body.Bytes(), &result)
	if len(result.Connections) != 1 || result.Connections[0].InstanceID != fixture.extra {
		t.Fatal(links.Body.String())
	}
	policy.Instances = []string{}
	if response := send(fixture.mux, "PUT", path, policy); response.Code != 200 {
		t.Fatal(response.Body.String())
	}
	check(fixture.extra, false)
	denied := httptest.NewRecorder()
	fixture.app.Subscriptions.Serve(denied, testutilRequest(fixture.user.Token))
	if denied.Code != 403 {
		t.Fatal("empty access still served", denied.Body.String())
	}
	if response := send(fixture.mux, "PUT", path, useraccess.Default()); response.Code != 200 {
		t.Fatal(response.Body.String())
	}
	check("default", true)
	check(fixture.extra, true)
}
func testutilRequest(token string) *http.Request {
	request := testutil.Request("GET", "/sub/"+token, "")
	request.SetPathValue("token", token)
	return request
}
func TestUnknownCoreCannotReplaceExistingPolicy(t *testing.T) {
	fixture := setup(t)
	path := "/users/" + fixture.user.ID + "/cores"
	policy := useraccess.Policy{Mode: useraccess.Selected, Instances: []string{"ffffffffffffffff"}}
	if response := send(fixture.mux, "PUT", path, policy); response.Code != 400 {
		t.Fatal(response.Body.String())
	}
	if !fixture.access.Store.Allows(fixture.user.ID, "default") {
		t.Fatal("failed save changed permissions")
	}
}
