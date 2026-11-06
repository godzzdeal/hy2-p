package instances_test

import (
	"context"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
	"testing"
)

func TestClonedCertificatesSurviveSourceRemoval(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	registry := openRegistry(t, t.TempDir())
	source, err := registry.Add("Source", settings("8444"))
	if err != nil {
		t.Fatal(err)
	}
	directory := filepath.Join(source.Core.Data, "certificates", "original")
	if err := os.MkdirAll(directory, 0700); err != nil {
		t.Fatal(err)
	}
	for _, file := range []string{"cert.pem", "key.pem"} {
		if err := os.WriteFile(filepath.Join(directory, file), []byte(file), 0600); err != nil {
			t.Fatal(err)
		}
	}
	draft := settings("8445")
	draft.Config = "# retained comment\nlisten: :8445\ntls:\n  cert: " + filepath.ToSlash(filepath.Join(directory, "cert.pem")) + "\n  key: " + filepath.ToSlash(filepath.Join(directory, "key.pem")) + "\n"
	clone, err := registry.Add("Clone", draft)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := registry.Remove(context.Background(), source.ID); err != nil {
		t.Fatal(err)
	}
	saved, err := clone.Config.Get()
	if err != nil {
		t.Fatal(err)
	}
	var config struct {
		TLS struct {
			Cert string
			Key  string
		}
	}
	if err := yaml.Unmarshal([]byte(saved.Config), &config); err != nil {
		t.Fatal(err)
	}
	for path, expected := range map[string]string{config.TLS.Cert: "cert.pem", config.TLS.Key: "key.pem"} {
		data, err := os.ReadFile(path)
		if err != nil || string(data) != expected {
			t.Fatal("cloned certificate lost", path, err)
		}
	}
}

func TestInvalidRegistryCannotAttachUnsafeDirectories(t *testing.T) {
	cases := [][]instances.Definition{
		{},
		{{ID: "../escape", Name: "Unsafe", Slot: 0}},
		{{ID: "default", Name: "Main", Slot: 0, Removing: true}},
		{{ID: "default", Name: "Main", Slot: 0}, {ID: "aaaaaaaaaaaaaaaa", Name: "Other", Slot: 0}},
	}
	for _, definitions := range cases {
		data := t.TempDir()
		if err := records.Write(filepath.Join(data, "instances"), "registry", definitions); err != nil {
			t.Fatal(err)
		}
		if _, err := instances.Open(context.Background(), data, nil, nil, nil, nil); err == nil {
			t.Fatal("invalid registry accepted", definitions)
		}
	}
}

func TestPersistenceAndSafeRemoval(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	data := t.TempDir()
	registry := openRegistry(t, data)
	first, err := registry.Add("Second", settings("8444"))
	if err != nil {
		t.Fatal(err)
	}
	second, err := registry.Add("Third", settings("8445"))
	if err != nil {
		t.Fatal(err)
	}
	if first.Core.StatsAddress() == second.Core.StatsAddress() || first.Core.ChallengePort() == second.Core.ChallengePort() {
		t.Fatal("shared internal listeners")
	}
	if first.Core.Running() || first.Core.Watchdog.Snapshot().DesiredRunning {
		t.Fatal("new core started unexpectedly")
	}
	if err := registry.Rename(first.ID, "Renamed"); err != nil {
		t.Fatal(err)
	}
	if _, err := registry.Remove(context.Background(), instances.DefaultID); err == nil {
		t.Fatal("default removed")
	}
	registry.Close()
	restored := openRegistry(t, data)
	if len(restored.Definitions()) != 3 || restored.Definitions()[1].Name != "Renamed" {
		t.Fatal("registry not restored")
	}
	current, err := restored.Get(first.ID)
	if err != nil {
		t.Fatal(err)
	}
	saved, err := current.Config.Get()
	if err != nil || saved.Port != "8444" {
		t.Fatal("profile not restored", err)
	}
	if _, err := restored.Get("../main"); err == nil {
		t.Fatal("unsafe id accepted")
	}
	if _, err := restored.Remove(context.Background(), first.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(data, "instances", first.ID)); !os.IsNotExist(err) {
		t.Fatal("retired runtime data remains", err)
	}
	if _, err := restored.Get(second.ID); err != nil {
		t.Fatal("other core lost", err)
	}
	main, _ := restored.Get(instances.DefaultID)
	if _, err := main.Config.Get(); err != nil {
		t.Fatal("default configuration lost", err)
	}
}
func TestLimitsAndPortReservations(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	t.Setenv("PANEL_CONTAINER", "true")
	t.Setenv("HYSTERIA_PUBLIC_PORT", "8443")
	t.Setenv("HYSTERIA_LISTEN_PORT", "8443")
	registry := openRegistry(t, t.TempDir())
	if _, err := registry.Add("Duplicate", settings("8443")); err == nil {
		t.Fatal("duplicate port accepted")
	}
	for _, port := range []string{"8444", "8445", "8446", "8447", "8448", "8449", "8450"} {
		if _, err := registry.Add(port, settings(port)); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := registry.Add("Ninth", settings("8451")); err == nil {
		t.Fatal("limit not enforced")
	}
}
