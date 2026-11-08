package groups_test

import (
	"encoding/json"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGroupsPersistAndDeletingKeepsUsers(t *testing.T) {
	fixture := setup(t)
	opened, err := groups.Open(fixture.data)
	if err != nil {
		t.Fatal(err)
	}
	current, ok := opened.ForUser(fixture.user.ID)
	if !ok || current.ID != fixture.group.ID {
		t.Fatal("membership lost")
	}
	if err := fixture.groups.Store.Remove(fixture.group.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := fixture.app.Users.User(fixture.user.ID); err != nil {
		t.Fatal("group deletion removed user")
	}
	if _, ok := fixture.groups.Store.ForUser(fixture.user.ID); ok {
		t.Fatal("membership remains")
	}
	if err := fixture.groups.Store.Assign(fixture.user.ID, "missing"); err == nil {
		t.Fatal("unknown group accepted")
	}
}
func TestInvalidGroupAndTooSmallDeviceLimitDoNotPersist(t *testing.T) {
	fixture := setup(t)
	group := fixture.group
	group.Color = "red; display:none"
	if err := fixture.groups.Store.Put(group); err == nil {
		t.Fatal("arbitrary CSS color accepted")
	}
	request := testutil.Request("GET", "/sub", "")
	for _, id := range []string{"group-device-0001", "group-device-0002"} {
		request.Header.Set("x-hwid", id)
		if _, err := fixture.devices.Store.Admit(fixture.user.ID, fixture.user.Password, request); err != nil {
			t.Fatal(err)
		}
	}
	group = fixture.group
	group.DeviceLimit = 1
	body, _ := json.Marshal(group)
	update := testutil.Request("PUT", "/groups/"+group.ID, string(body))
	update.SetPathValue("group", group.ID)
	response := httptest.NewRecorder()
	fixture.groups.Save(response, update)
	if response.Code != 409 || fixture.groups.Store.DeviceLimit(fixture.user.ID) != 0 {
		t.Fatal(response.Code, response.Body.String())
	}
}
func TestGroupAssignmentRequiresExistingUserAndGroup(t *testing.T) {
	fixture := setup(t)
	for _, input := range []struct {
		user, body string
		status     int
	}{
		{"bbbbbbbbbbbbbbbb", `{"groupId":"aaaaaaaaaaaaaaaa"}`, 404},
		{fixture.user.ID, `{"groupId":"bbbbbbbbbbbbbbbb"}`, 409},
		{fixture.user.ID, `{"groupId":""}`, 200},
	} {
		request := testutil.Request("PUT", "/group", input.body)
		request.SetPathValue("id", input.user)
		response := httptest.NewRecorder()
		fixture.groups.Assign(response, request)
		if response.Code != input.status {
			t.Fatal(response.Code, response.Body.String())
		}
	}
	if _, ok := fixture.groups.Store.ForUser(fixture.user.ID); ok {
		t.Fatal("membership not cleared")
	}
	if strings.Contains(stringMustMarshal(t, fixture.groups.Store.Snapshot()), fixture.user.Password) {
		t.Fatal("credential leaked")
	}
}
func stringMustMarshal(t *testing.T, value any) string {
	t.Helper()
	encoded, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return string(encoded)
}
