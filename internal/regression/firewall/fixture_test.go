package firewall_test

import (
	"context"
	"hy2-panel/internal/firewall/host"
	"os"
	"path/filepath"
	"testing"
)

type call struct {
	program string
	args    []string
}
type fixture struct {
	service *host.Service
	calls   []call
	output  func(string, []string) (string, error)
}

func setup(t *testing.T) *fixture {
	t.Helper()
	root := t.TempDir()
	root, err := filepath.EvalSymlinks(root)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "firewall"), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "firewall", "protected.json"), []byte(`[22,2222]`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, ".env"), []byte("PANEL_PORT=9443\n"), 0600); err != nil {
		t.Fatal(err)
	}
	service, err := host.New(root)
	if err != nil {
		t.Fatal(err)
	}
	fixture := &fixture{service: service}
	fixture.output = func(string, []string) (string, error) { return "Status: active", nil }
	service.Execute = func(ctx context.Context, program string, args ...string) (string, error) {
		fixture.calls = append(fixture.calls, call{program, append([]string{}, args...)})
		return fixture.output(program, args)
	}
	return fixture
}
