package groups_test

import (
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/useraccess"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGroupAndPersonalCoreAccessIntersect(t *testing.T) {
	fixture := setup(t)
	settings, err := fixture.app.Config.Get()
	if err != nil {
		t.Fatal(err)
	}
	settings.Port = "8444"
	settings.Config = strings.ReplaceAll(settings.Config, "8443", "8444")
	extra, err := fixture.registry.Add("Second", settings)
	if err != nil {
		t.Fatal(err)
	}
	group := fixture.group
	group.Access = useraccess.Policy{Mode: useraccess.Selected, Instances: []string{"default"}}
	if err := fixture.groups.Store.Put(group); err != nil {
		t.Fatal(err)
	}
	if fixture.access.Allows(fixture.user.ID, extra.ID) || !fixture.access.Allows(fixture.user.ID, "default") {
		t.Fatal("group access bypass")
	}
	denied := httptest.NewRecorder()
	fixture.app.Users.AuthenticateFor(extra.ID)(denied, testutil.Request("POST", "/auth", `{"auth":"`+fixture.user.Password+`"}`))
	if !strings.Contains(denied.Body.String(), `"ok":false`) {
		t.Fatal("saved link bypassed group", denied.Body.String())
	}
	if err := fixture.access.Store.Put(fixture.user.ID, useraccess.Policy{Mode: useraccess.Selected, Instances: []string{extra.ID}}); err != nil {
		t.Fatal(err)
	}
	if fixture.access.Allows(fixture.user.ID, "default") || fixture.access.Allows(fixture.user.ID, extra.ID) {
		t.Fatal("personal policy was widened")
	}
}
func TestGroupQuotaDoesNotResetCountersOrWidenPersonalLimit(t *testing.T) {
	fixture := setup(t)
	group := fixture.group
	group.TrafficLimit = 100
	if err := fixture.groups.Store.Put(group); err != nil {
		t.Fatal(err)
	}
	initial := httptest.NewRecorder()
	fixture.groups.ReadTraffic(initial, testutil.Request("GET", "/traffic", ""))
	if !strings.Contains(initial.Body.String(), `"groupLimit":100`) {
		t.Fatal("new member quota missing", initial.Body.String())
	}
	request := testutil.Request("PUT", "/traffic", `{"upload":100,"download":0,"limit":0}`)
	request.SetPathValue("id", fixture.user.ID)
	response := httptest.NewRecorder()
	fixture.traffic.Adjust(response, request)
	if response.Code != 200 || fixture.traffic.Allowed(fixture.user.ID) {
		t.Fatal("group quota bypass", response.Body.String())
	}
	usage := fixture.traffic.Snapshot().Users[fixture.user.ID]
	if usage.Upload != 100 || usage.GroupLimit != 100 || usage.Limit != 0 {
		t.Fatal(usage)
	}
	if err := fixture.groups.Store.Remove(group.ID); err != nil {
		t.Fatal(err)
	}
	if !fixture.traffic.Allowed(fixture.user.ID) || fixture.traffic.Snapshot().Users[fixture.user.ID].Upload != 100 {
		t.Fatal("group removal reset counters")
	}
	request = testutil.Request("PUT", "/traffic", `{"upload":75,"download":0,"limit":50}`)
	request.SetPathValue("id", fixture.user.ID)
	fixture.traffic.Adjust(httptest.NewRecorder(), request)
	if err := fixture.groups.Store.Put(group); err != nil {
		t.Fatal(err)
	}
	if err := fixture.groups.Store.Assign(fixture.user.ID, group.ID); err != nil {
		t.Fatal(err)
	}
	if fixture.traffic.Allowed(fixture.user.ID) {
		t.Fatal("group widened personal quota")
	}
}
func TestGroupDeviceCapRejectsLegacyAndExtraDevices(t *testing.T) {
	fixture := setup(t)
	group := fixture.group
	group.DeviceLimit = 1
	if err := fixture.groups.Store.Put(group); err != nil {
		t.Fatal(err)
	}
	request := testutil.Request("GET", "/sub", "")
	if _, err := fixture.devices.Store.Admit(fixture.user.ID, fixture.user.Password, request); err == nil {
		t.Fatal("missing HWID bypassed group")
	}
	request.Header.Set("x-hwid", "group-device-0001")
	key, err := fixture.devices.Store.Admit(fixture.user.ID, fixture.user.Password, request)
	if err != nil || key == fixture.user.Password {
		t.Fatal("device key", err)
	}
	request.Header.Set("x-hwid", "group-device-0002")
	if _, err := fixture.devices.Store.Admit(fixture.user.ID, fixture.user.Password, request); err == nil {
		t.Fatal("second device accepted")
	}
	if fixture.devices.AllowedIdentity(fixture.user.ID) {
		t.Fatal("legacy identity bypassed group")
	}
	if _, ok := fixture.devices.Store.Resolve(key); !ok {
		t.Fatal("first device rejected")
	}
}
