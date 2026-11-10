package ech_test

import (
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/profiles"
	"hy2-panel/internal/core/tools"
	"hy2-panel/internal/core/tools/ech"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"testing"
)

func TestDraftKeyMustStayInsideGeneratedDirectory(t *testing.T) {
	root := t.TempDir()
	key := filepath.Join(root, "ech", "generated", "ech.pem")
	outside := filepath.Join(root, "secret.pem")
	writeKey(t, key, "public.example.com")
	writeKey(t, outside, "other.example.com")
	if !ech.IsGenerated(root, key) {
		t.Fatal("generated key rejected")
	}
	for _, path := range []string{outside, filepath.Join(root, "ech"), filepath.Join(root, "ech", "..", "secret.pem"), filepath.Join(root, "ech", "missing")} {
		if ech.IsGenerated(root, path) {
			t.Fatalf("accepted %s", path)
		}
	}
	link := filepath.Join(root, "ech", "escape.pem")
	if err := os.Symlink(outside, link); err != nil {
		t.Skip("symlink creation unavailable")
	}
	if ech.IsGenerated(root, link) {
		t.Fatal("symlink escaped generated directory")
	}
}

func TestReadAllowsGeneratedDraftAndSavedExternalKeyOnly(t *testing.T) {
	root := t.TempDir()
	generated := filepath.Join(root, "ech", "generated", "ech.pem")
	external := filepath.Join(root, "external.pem")
	writeKey(t, generated, "public.example.com")
	writeKey(t, external, "external.example.com")
	store := &profiles.Store{Directory: t.TempDir()}
	if err := store.Put(configuration.Settings{Config: "ech: {}\n"}); err != nil {
		t.Fatal(err)
	}
	handler := tools.Handler{Config: &configuration.Handler{Profile: store}, Data: root}
	for _, scenario := range []struct {
		path   string
		status int
	}{{generated, 200}, {external, 400}} {
		response := httptest.NewRecorder()
		handler.Read(response, testutil.Request("GET", "/tools/ech?keyPath="+url.QueryEscape(scenario.path), ""))
		if response.Code != scenario.status {
			t.Fatalf("%s: %d %s", scenario.path, response.Code, response.Body.String())
		}
	}
	if err := store.Put(configuration.Settings{Config: "ech:\n  keyPath: " + strconv.Quote(external) + "\n"}); err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	handler.Read(response, testutil.Request("GET", "/tools/ech", ""))
	if response.Code != 200 {
		t.Fatal(response.Code, response.Body.String())
	}
}
