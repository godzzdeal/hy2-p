package configuration_test

import (
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestConfigurationPreservesRawAndHistory(t *testing.T) {
	a := testutil.New(t)
	s, _ := a.Config.Get()
	s.Config += "futureFeature:\n  someKey: enabled\n"
	s.PinSHA256 = strings.Repeat("AA:", 31) + "AA"
	body, _ := json.Marshal(s)
	w := httptest.NewRecorder()
	a.Config.Save(w, testutil.Request("PUT", "/api/settings", string(body)))
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	saved, _ := a.Config.Get()
	if saved.Config != s.Config {
		t.Fatal("YAML modified")
	}
	if saved.PinSHA256 != s.PinSHA256 {
		t.Fatal("certificate pin was not persisted")
	}
	var count int
	a.DB.QueryRow("SELECT count(*) FROM history").Scan(&count)
	if count != 1 {
		t.Fatal("history not persisted")
	}
	s.Config = "tls: {}\nacme: {}"
	if configuration.Validate(s) == nil {
		t.Fatal("conflicting TLS modes accepted")
	}
	s.Config = "tls: {}\n---\ntls: {}"
	if configuration.Validate(s) == nil {
		t.Fatal("multiple documents accepted")
	}
}

func TestInvalidCertificatePinsAreRejected(t *testing.T) {
	app := testutil.New(t)
	settings, err := app.Config.Get()
	if err != nil {
		t.Fatal(err)
	}
	for _, pin := range []string{":", "::", "not-hex", strings.Repeat("a", 63), strings.Repeat("z", 64), strings.Repeat("a", 65)} {
		settings.PinSHA256 = pin
		if configuration.Validate(settings) == nil {
			t.Fatalf("invalid pin accepted: %q", pin)
		}
	}
	for _, pin := range []string{"", " ", strings.Repeat("AB:", 31) + "AB", strings.Repeat("ab", 32)} {
		settings.PinSHA256 = pin
		if err := configuration.Validate(settings); err != nil {
			t.Fatalf("valid pin rejected: %v", err)
		}
	}
}
