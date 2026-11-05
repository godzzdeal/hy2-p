package websettings_test

import (
	"encoding/json"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/websettings"
	"net/http/httptest"
	"testing"
)

func TestACMEBootstrapAndPersistedSettingsPriority(t *testing.T) {
	t.Setenv("PANEL_TLS_MODE", "acme")
	t.Setenv("PANEL_DOMAIN", "panel.example.com")
	t.Setenv("PANEL_ACME_EMAIL", "owner@example.com")
	t.Setenv("PANEL_ACME_ACCEPT_TERMS", "false")
	directory := t.TempDir()
	if _, err := websettings.Open(directory, ":9443", ""); err == nil {
		t.Fatal("ACME enabled without accepted terms")
	}
	t.Setenv("PANEL_ACME_ACCEPT_TERMS", "true")
	handler, err := websettings.Open(directory, ":9443", "")
	if err != nil {
		t.Fatal(err)
	}
	if handler.Active().Mode != "acme" || handler.Active().Domain != "panel.example.com" {
		t.Fatal(handler.Active())
	}
	config := handler.Current()
	config.Mode = "http"
	config.Port = 8080
	body, _ := json.Marshal(config)
	writer := httptest.NewRecorder()
	handler.Save(writer, testutil.Request("PUT", "/settings", string(body)))
	if writer.Code != 200 {
		t.Fatal(writer.Body.String())
	}
	t.Setenv("PANEL_TLS_MODE", "invalid")
	handler, err = websettings.Open(directory, ":9443", "")
	if err != nil || handler.Active().Mode != "http" || handler.Active().Port != 8080 {
		t.Fatal("saved settings overwritten by environment", err)
	}
}
