package transfer_test

import (
	"context"
	"hy2-panel/internal/core"
	"hy2-panel/internal/devices"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transfer"
	"hy2-panel/internal/useraccess"
	"testing"
)

func setup(t *testing.T) *transfer.Service {
	t.Helper()
	t.Setenv("HYSTERIA_BIN", "missing-transfer-test-binary")
	app, data := testutil.New(t), t.TempDir()
	runtime, err := core.New(app.DB, app.Config, data, "fixture-only")
	if err != nil {
		t.Fatal(err)
	}
	registry, err := instances.Open(context.Background(), data, app.DB, app.Users.Vault, app.Config, runtime)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(registry.Close)
	groupStore, err := groups.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	access, err := useraccess.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	deviceStore, err := devices.Open(data, app.Users.Vault)
	if err != nil {
		t.Fatal(err)
	}
	usage, err := traffic.New(data, "fixture", registry)
	if err != nil {
		t.Fatal(err)
	}
	return &transfer.Service{Users: app.Users, Registry: registry, Groups: groupStore, Access: access, Devices: deviceStore, Traffic: usage}
}
func TestRepeatedMulticoreMergeKeepsGroupMappingsStable(t *testing.T) {
	source, target := setup(t), setup(t)
	main, err := source.Registry.Get("default")
	if err != nil {
		t.Fatal(err)
	}
	settings, err := main.Config.Get()
	if err != nil {
		t.Fatal(err)
	}
	settings.Port = "62001"
	settings.Config = "listen: :62001\nacme:\n  domains:\n    - extra.example.org\n"
	if _, err := source.Registry.Add("Extra", settings); err != nil {
		t.Fatal(err)
	}
	group := groups.Group{ID: "bbbbbbbbbbbbbbbb", Name: "Both cores", Color: "cyan", Access: useraccess.Default()}
	if err := source.Groups.Put(group); err != nil {
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
	const repetitions = 20
	for attempt := 0; attempt < repetitions; attempt++ {
		preview, err := target.Preview(bundle)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range preview.Rows {
			if row.Action != "skip" {
				t.Fatal("identical data produced a conflict", row)
			}
		}
	}
}
