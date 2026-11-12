package websettings_test

import (
	"encoding/json"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/websettings"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestManualTLSSettingsPersistWithoutLeakingKey(t *testing.T) {
	directory := t.TempDir()
	handler, err := websettings.Open(directory, "127.0.0.1:8080", "")
	if err != nil {
		t.Fatal(err)
	}
	cert, key := certificate(t)
	config := handler.Current()
	config.Mode = "manual"
	config.Domain = "panel.example.com"
	config.Port = 9443
	config.Certificate = cert
	config.PrivateKey = key
	save := func() *httptest.ResponseRecorder {
		payload, _ := json.Marshal(config)
		result := httptest.NewRecorder()
		handler.Save(result, testutil.Request("PUT", "/settings", string(payload)))
		return result
	}
	result := save()
	if result.Code != 200 || strings.Contains(result.Body.String(), "PRIVATE KEY") || !strings.Contains(result.Body.String(), `"restartRequired":true`) {
		t.Fatal(result.Body.String())
	}
	if handler.Active().Port != 8080 {
		t.Fatal("unannounced listener change")
	}
	config.PrivateKey = ""
	if result = save(); result.Code != 200 {
		t.Fatal("existing key not retained", result.Body.String())
	}
	handler, err = websettings.Open(directory, "127.0.0.1:8080", "")
	if err != nil {
		t.Fatal(err)
	}
	if handler.Active().URL() != "https://panel.example.com:9443" {
		t.Fatal(handler.Active().URL())
	}
	result = httptest.NewRecorder()
	handler.Read(result, testutil.Request("GET", "/settings", ""))
	if strings.Contains(result.Body.String(), "PRIVATE KEY") || !strings.Contains(result.Body.String(), `"restartRequired":false`) {
		t.Fatal(result.Body.String())
	}
	tlsConfig, challenge, err := handler.TLS()
	if err != nil || challenge != nil || len(tlsConfig.Certificates) != 1 {
		t.Fatal("manual TLS not configured", err)
	}
}
func TestSettingsValidationAndACME(t *testing.T) {
	config := websettings.Config{Host: "0.0.0.0", Port: 9443, Mode: "acme", Domain: "panel.example.com", Email: "admin@example.com", ChallengePort: 9080, AcceptedTerms: true}
	if err := websettings.Validate(config); err != nil {
		t.Fatal(err)
	}
	invalid := []websettings.Config{}
	next := config
	next.AcceptedTerms = false
	invalid = append(invalid, next)
	next = config
	next.ChallengePort = 9443
	invalid = append(invalid, next)
	next = config
	next.Port = 9999
	invalid = append(invalid, next)
	next = config
	next.Domain = "https://panel.example.com"
	invalid = append(invalid, next)
	next = config
	next.PublicURL = "https://user:pass@panel.example.com"
	invalid = append(invalid, next)
	for _, value := range invalid {
		if websettings.Validate(value) == nil {
			t.Fatalf("accepted %+v", value)
		}
	}
	handler, err := websettings.Open(t.TempDir(), "0.0.0.0:8080", "")
	if err != nil {
		t.Fatal(err)
	}
	payload, _ := json.Marshal(config)
	result := httptest.NewRecorder()
	handler.Save(result, testutil.Request("PUT", "/settings", string(payload)))
	if result.Code != 200 {
		t.Fatal(result.Body.String())
	}
}

func TestManualIPCertificateDoesNotRequireADomain(t *testing.T) {
	cert, key := certificate(t)
	config := websettings.Config{Host: "0.0.0.0", Port: 9443, Mode: "manual", Domain: "203.0.113.10", Certificate: cert, PrivateKey: key, ChallengePort: 9080}
	if err := websettings.Validate(config); err != nil {
		t.Fatal(err)
	}
	config.Domain = "203.0.113.11"
	if websettings.Validate(config) == nil {
		t.Fatal("certificate accepted for the wrong IP")
	}
}
func TestPublicAddress(t *testing.T) {
	if got := websettings.PublicAddress(websettings.Config{PublicURL: "http://203.0.113.25:8080", Mode: "http", Port: 9777}, "127.0.0.1:18080"); got != "http://203.0.113.25:9777" {
		t.Fatal("frontend proxy replaced external host", got)
	}
	for _, item := range []struct{ domain, host, mode, want string }{
		{"vpn.example.com", "old.example.com:8080", "acme", "https://vpn.example.com:9443"},
		{"", "203.0.113.10:8080", "http", "http://203.0.113.10:9443"},
		{"", "[2001:db8::1]:8080", "http", "http://[2001:db8::1]:9443"},
	} {
		got := websettings.PublicAddress(websettings.Config{Domain: item.domain, Mode: item.mode, Port: 9443}, item.host)
		if got != item.want {
			t.Fatalf("got %s, want %s", got, item.want)
		}
	}
}
