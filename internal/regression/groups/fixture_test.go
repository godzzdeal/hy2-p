package groups_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/core"
	deviceapi "hy2-panel/internal/devices/integration"
	"hy2-panel/internal/groups"
	groupapi "hy2-panel/internal/groups/integration"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/useraccess"
	accessapi "hy2-panel/internal/useraccess/integration"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"testing"
)

type fixture struct {
	app      *testutil.Application
	groups   *groupapi.Handler
	access   *accessapi.Handler
	devices  *deviceapi.Handler
	traffic  *traffic.Service
	registry *instances.Registry
	user     users.User
	group    groups.Group
	data     string
}

func setup(t *testing.T) fixture {
	t.Helper()
	t.Setenv("HYSTERIA_BIN", "missing-group-test-binary")
	app := testutil.New(t)
	data := t.TempDir()
	runtime, err := core.New(app.DB, app.Config, data, "group-fixture-only")
	if err != nil {
		t.Fatal(err)
	}
	registry, err := instances.Open(context.Background(), data, app.DB, app.Users.Vault, app.Config, runtime)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(registry.Close)
	access, err := accessapi.Open(data, registry, app.Users)
	if err != nil {
		t.Fatal(err)
	}
	devices, err := deviceapi.Open(data, app.Users, func(string) {})
	if err != nil {
		t.Fatal(err)
	}
	stats, err := traffic.New(data, registry)
	if err != nil {
		t.Fatal(err)
	}
	handler, err := groupapi.Open(data, registry, app.Users, access, devices, stats)
	if err != nil {
		t.Fatal(err)
	}
	app.Users.Allow = stats.Allowed
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"Group test"}`))
	var user users.User
	if err := json.Unmarshal(created.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	user, err = app.Users.User(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	group := groups.Group{ID: "aaaaaaaaaaaaaaaa", Name: "Test", Color: "cyan", Access: useraccess.Default()}
	if err := handler.Store.Put(group); err != nil {
		t.Fatal(err)
	}
	if err := handler.Store.Assign(user.ID, group.ID); err != nil {
		t.Fatal(err)
	}
	return fixture{app, handler, access, devices, stats, registry, user, group, data}
}

func (fixture fixture) createUser(t *testing.T) users.User {
	t.Helper()
	response := httptest.NewRecorder()
	fixture.app.Users.Create(response, testutil.Request("POST", "/users", `{"name":"Second member"}`))
	var user users.User
	if response.Code != 201 || json.Unmarshal(response.Body.Bytes(), &user) != nil {
		t.Fatal(response.Body.String())
	}
	return user
}

func (fixture fixture) setMembers(t *testing.T, group string, users []string) *httptest.ResponseRecorder {
	t.Helper()
	request := testutil.Request("PUT", "/groups/members", stringMustMarshal(t, map[string]any{"userIds": users}))
	request.SetPathValue("group", group)
	response := httptest.NewRecorder()
	fixture.groups.Members(response, request)
	return response
}
