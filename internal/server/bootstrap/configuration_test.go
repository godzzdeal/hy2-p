package bootstrap

import (
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/websettings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestDomainSeedsConnectionSNIAndACMEWithoutOverwritingAnInstallation(t *testing.T) {
	web := websettings.Config{Domain: "panel.example.com", Email: "owner@example.com", Mode: "acme"}
	initial := InitialConfiguration(web)
	if initial.Host != web.Domain || initial.SNI != web.Domain {
		t.Fatal("shared address not used")
	}
	var config struct {
		ACME struct {
			Domains []string
			Email   string
		}
	}
	if err := yaml.Unmarshal([]byte(initial.Config), &config); err != nil {
		t.Fatal(err)
	}
	if len(config.ACME.Domains) != 1 || config.ACME.Domains[0] != web.Domain || config.ACME.Email != web.Email {
		t.Fatal("ACME defaults not seeded")
	}
	directory := t.TempDir()
	db, err := OpenDatabase(directory, initial)
	if err != nil {
		t.Fatal(err)
	}
	db.Close()
	web.Domain = "another-panel.example.com"
	db, err = OpenDatabase(directory, InitialConfiguration(web))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	handler := configuration.Handler{DB: db}
	stored, err := handler.Get()
	if err != nil || stored.Host != initial.Host || stored.Config != initial.Config {
		t.Fatal("panel domain change overwrote a saved instance", err)
	}
}

func TestIPDefaultsDoNotAssumeHysteriaSupportsShortLivedACMEProfiles(t *testing.T) {
	initial := InitialConfiguration(websettings.Config{PublicURL: "http://203.0.113.10:8080", Mode: "http"})
	if initial.Host != "203.0.113.10" || initial.SNI != "203.0.113.10" {
		t.Fatal("public IP was not shared")
	}
	if err := configuration.Validate(initial); err != nil {
		t.Fatal(err)
	}
}
