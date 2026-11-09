package transfer_test

import (
	"hy2-panel/internal/groups"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/useraccess"
	"net/http/httptest"
	"testing"
)

func TestRoundTripPreservesCredentialsGroupsLimitsAndDoesNotOverwrite(t *testing.T) {
	source, target := setup(t), setup(t)
	response := httptest.NewRecorder()
	source.Users.Create(response, testutil.Request("POST", "/users", `{"name":"Phone","password":"fixture-password-1234"}`))
	if response.Code != 201 {
		t.Fatal(response.Body.String())
	}
	list, err := source.Users.All()
	if err != nil {
		t.Fatal(err)
	}
	id := list[0].ID
	group := groups.Group{ID: "aaaaaaaaaaaaaaaa", Name: "Work", Color: "cyan", Access: useraccess.Default(), DeviceLimit: 3}
	if err := source.Groups.Put(group); err != nil {
		t.Fatal(err)
	}
	if err := source.Groups.Assign(id, group.ID); err != nil {
		t.Fatal(err)
	}
	if err := source.Devices.SetLimit(id, 2); err != nil {
		t.Fatal(err)
	}
	if err := source.Traffic.ImportUsage(id, traffic.Usage{Upload: 12, Download: 34, Limit: 1000}); err != nil {
		t.Fatal(err)
	}
	bundle, err := source.Export()
	if err != nil {
		t.Fatal(err)
	}
	preview, err := target.Preview(bundle)
	if err != nil {
		t.Fatal(err)
	}
	result, err := target.Apply(bundle, preview.Fingerprint)
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range result.Rows {
		if row.Action == "failed" || row.Action == "conflict" {
			t.Fatal(row)
		}
	}
	imported, err := target.Users.User(id)
	if err != nil {
		t.Fatal(err)
	}
	if imported.Password != bundle.Users[0].Password || imported.Token != bundle.Users[0].Token {
		t.Fatal("credentials lost")
	}
	if target.Devices.Snapshot(id).Limit != 2 || target.Traffic.Snapshot().Users[id].Download != 34 || target.Groups.Snapshot().Memberships[id] != group.ID {
		t.Fatal("settings lost")
	}
	if target.Access.Get(id).Mode != useraccess.Selected || !target.Access.Allows(id, "default") || target.Access.Allows(id, "new-core") {
		t.Fatal("import widened access")
	}
	stored, err := target.Users.All()
	if err != nil {
		t.Fatal(err)
	}
	if stored[0].Password == imported.Password {
		t.Fatal("password not encrypted at rest")
	}
	preview, err = target.Preview(bundle)
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range preview.Rows {
		if row.Kind == "user" && row.Action != "skip" {
			t.Fatal("duplicate user not detected")
		}
	}
	if _, err := target.Apply(bundle, preview.Fingerprint); err != nil {
		t.Fatal(err)
	}
	stored, _ = target.Users.All()
	if len(stored) != 1 {
		t.Fatal("duplicate imported")
	}
}
func TestStalePreviewIsRejectedAndExplicitCoreBindingResolvesConflict(t *testing.T) {
	source, target := setup(t), setup(t)
	bundle, err := source.Export()
	if err != nil {
		t.Fatal(err)
	}
	bundle.Profiles[0].Settings.Host = "other.example.org"
	preview, err := target.Preview(bundle)
	if err != nil {
		t.Fatal(err)
	}
	if preview.Rows[0].Action != "conflict" {
		t.Fatal("port collision missed")
	}
	bundle.Targets = map[string]string{"default": "default"}
	preview, err = target.Preview(bundle)
	if err != nil {
		t.Fatal(err)
	}
	if preview.Rows[0].Action != "skip" || preview.Rows[0].Target != "default" {
		t.Fatal("binding not applied")
	}
	bundle.Profiles[0].Name = "changed after preview"
	if _, err := target.Apply(bundle, preview.Fingerprint); err == nil {
		t.Fatal("changed import accepted")
	}
}
