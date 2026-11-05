package configuration_test

import (
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestConfigurationPreservesRawAndHistory(t *testing.T) {
	a := testutil.New(t)
	s, _ := a.Config.Get()
	s.Config += "futureFeature:\n  someKey: enabled\n"
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
