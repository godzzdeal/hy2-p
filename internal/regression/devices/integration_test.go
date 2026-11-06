package devices_test

import (
	"encoding/json"
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/security"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBoundCredentialsAndDeviceLimit(t *testing.T) {
	fixture := setup(t)
	if err := fixture.handler.Store.SetLimit(fixture.user.ID, 1); err != nil {
		t.Fatal(err)
	}
	if missing := fixture.subscription(""); missing.Code != 403 || missing.Header().Get("x-hwid-not-supported") != "true" {
		t.Fatal(missing.Body.String())
	}
	first := fixture.subscription("device-00000001")
	password := secret(t, first)
	if password == fixture.user.Password || first.Header().Get("subscription-always-hwid-enable") != "1" {
		t.Fatal("shared credential leaked")
	}
	if next := secret(t, fixture.subscription("device-00000001")); next != password {
		t.Fatal("same device consumed another credential")
	}
	if denied := fixture.subscription("device-00000002"); denied.Code != 403 || denied.Header().Get("x-hwid-max-devices-reached") != "true" {
		t.Fatal(denied.Body.String())
	}
	response := fixture.authenticate(password)
	var authenticated struct {
		ID string
		OK bool
	}
	json.Unmarshal(response.Body.Bytes(), &authenticated)
	if !authenticated.OK || security.ParentUser(authenticated.ID) != fixture.user.ID || authenticated.ID == fixture.user.ID {
		t.Fatal(response.Body.String())
	}
	if fixture.handler.AllowedIdentity(fixture.user.ID) {
		t.Fatal("stale legacy session bypasses device limit")
	}
	if response := fixture.authenticate(fixture.user.Password); strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal("old standalone URI bypassed device limit")
	}
	data := fixture.handler.Store.Snapshot(fixture.user.ID)
	if len(data.Devices) != 1 || data.Devices[0].Model != "iPhone fixture" || data.Devices[0].LastConnected == "" || data.Devices[0].ConnectionIP != "203.0.113.4" {
		t.Fatal(data)
	}
	id := data.Devices[0].ID
	if err := fixture.handler.Store.SetBlocked(fixture.user.ID, id, true); err != nil {
		t.Fatal(err)
	}
	if fixture.handler.AllowedIdentity(authenticated.ID) {
		t.Fatal("revoked identity remained valid")
	}
	if response := fixture.authenticate(password); strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal("revoked cached key accepted")
	}
	if response := fixture.subscription("device-00000001"); response.Code != 403 {
		t.Fatal("blocked device re-enrolled")
	}
	if err := fixture.handler.Store.SetBlocked(fixture.user.ID, id, false); err != nil {
		t.Fatal(err)
	}
	fixture.app.Users.AllowCore = func(string, string) bool { return false }
	if response := fixture.authenticate(password); strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal("device key bypassed core restrictions")
	}
}
func TestPasswordRotationRevokesAllDeviceCredentials(t *testing.T) {
	fixture := setup(t)
	old := secret(t, fixture.subscription("device-00000001"))
	request := testutil.Request("PATCH", "/users", `{"name":"Phone","enabled":true,"password":"changed-device-parent-password"}`)
	request.SetPathValue("id", fixture.user.ID)
	result := httptest.NewRecorder()
	fixture.app.Users.Edit(result, request)
	if result.Code != 200 {
		t.Fatal(result.Body.String())
	}
	if response := fixture.authenticate(old); strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal("old child credential survived parent rotation")
	}
	changed := secret(t, fixture.subscription("device-00000001"))
	if changed == old {
		t.Fatal("child credential not regenerated")
	}
	if response := fixture.authenticate(changed); !strings.Contains(response.Body.String(), `"ok":true`) {
		t.Fatal(response.Body.String())
	}
}
func TestPublicDeviceAPIContainsNoCredentialsAndAdminLinksUseSubscription(t *testing.T) {
	fixture := setup(t)
	if err := fixture.handler.Store.SetLimit(fixture.user.ID, 1); err != nil {
		t.Fatal(err)
	}
	password := secret(t, fixture.subscription("device-00000001"))
	response := httptest.NewRecorder()
	fixture.mux.ServeHTTP(response, testutil.Request("GET", "/users/"+fixture.user.ID+"/devices", ""))
	for _, private := range []string{password, fixture.user.Password, "device-00000001", `"password"`, `"digest"`, `"parent"`} {
		if strings.Contains(response.Body.String(), private) {
			t.Fatal("device credential leak", private)
		}
	}
	var data model.Summary
	if err := json.Unmarshal(response.Body.Bytes(), &data); err != nil || len(data.Devices) != 1 {
		t.Fatal(response.Body.String())
	}
	request := testutil.Request("GET", "/links", "")
	request.SetPathValue("id", fixture.user.ID)
	links := httptest.NewRecorder()
	fixture.app.Subscriptions.Links(links, request)
	if !strings.Contains(links.Body.String(), `"uri":""`) || !strings.Contains(links.Body.String(), `"deviceLimit":1`) {
		t.Fatal(links.Body.String())
	}
}

func TestMissingDeviceLimitCannotDisableAnExistingLimit(t *testing.T) {
	fixture := setup(t)
	if err := fixture.handler.Store.SetLimit(fixture.user.ID, 1); err != nil {
		t.Fatal(err)
	}
	result := httptest.NewRecorder()
	fixture.mux.ServeHTTP(result, testutil.Request("PUT", "/users/"+fixture.user.ID+"/devices", `{}`))
	if result.Code != 400 || fixture.handler.Store.Limit(fixture.user.ID) != 1 {
		t.Fatal("missing limit disabled restriction", result.Body.String())
	}
}
