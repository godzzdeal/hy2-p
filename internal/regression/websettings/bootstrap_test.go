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

func TestHTTPWithoutDomainAndContainerBinding(t *testing.T) {
	t.Setenv("PANEL_TLS_MODE", "http")
	t.Setenv("PANEL_DOMAIN", "")
	t.Setenv("PANEL_CONTAINER", "true")
	handler, err := websettings.Open(t.TempDir(), "127.0.0.1:8080", "http://203.0.113.10:8080")
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Close()
	config, challenge, err := handler.TLS()
	if err != nil || config != nil || challenge != nil {
		t.Fatal("HTTP requested certificates", err)
	}
	if handler.Active().Address() != "0.0.0.0:8080" || handler.Active().Host != "127.0.0.1" {
		t.Fatal("Docker binding is confused with the internal listener")
	}
	if handler.Active().URL() != "http://203.0.113.10:8080" {
		t.Fatal("public IP URL lost")
	}
	t.Setenv("PANEL_CONTAINER", "false")
	if handler.Active().Address() != "127.0.0.1:8080" {
		t.Fatal("native loopback binding widened")
	}
}

func TestACMEAcceptsPublicIPv4AndIPv6ButRejectsPrivateAddresses(t *testing.T) {
	config := websettings.Config{Host: "0.0.0.0", Port: 9443, Mode: "acme", Email: "test@example.com", ChallengePort: 9080, AcceptedTerms: true}
	for _, address := range []string{"8.8.8.8", "2606:4700:4700::1111"} {
		config.Domain = address
		if err := websettings.Validate(config); err != nil {
			t.Fatal(address, err)
		}
	}
	if config.URL() != "https://[2606:4700:4700::1111]:9443" {
		t.Fatal("invalid IPv6 URL", config.URL())
	}
	for _, address := range []string{"127.0.0.1", "10.0.0.1", "192.168.1.1", "::1", "fe80::1", "fc00::1", "::ffff:8.8.8.8", "https://8.8.8.8", "[2606:4700:4700::1111]"} {
		config.Domain = address
		if websettings.Validate(config) == nil {
			t.Fatal("invalid public certificate address accepted", address)
		}
	}
}
