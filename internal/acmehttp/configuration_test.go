package acmehttp_test

import (
	"hy2-panel/internal/acmehttp"
	"path/filepath"
	"testing"
)

func TestManagedHTTPAndOtherModes(t *testing.T) {
	for _, kind := range []string{"", "http", "dns", "tls"} {
		config := map[string]any{"type": kind, "domains": []string{"core.example.com"}, "http": map[string]any{"altPort": 8888}}
		document := map[string]any{"acme": config}
		acmehttp.Prepare(document, "/data", true)
		if config["dir"] != filepath.Join("/data", "acme-hy2") {
			t.Fatal("ACME storage not persistent")
		}
		if kind == "" || kind == "http" {
			if config["type"] != "http" || config["listenHost"] != "127.0.0.1" || config["http"].(map[string]any)["altPort"] != 9090 {
				t.Fatal(config)
			}
		} else if config["type"] != kind || config["http"].(map[string]any)["altPort"] != 8888 {
			t.Fatal("non-HTTP challenge changed")
		}
	}
	native := map[string]any{"acme": map[string]any{"http": map[string]any{"altPort": 8888}}}
	acmehttp.Prepare(native, "/data", false)
	if native["acme"].(map[string]any)["http"].(map[string]any)["altPort"] != 8888 {
		t.Fatal("standalone configuration overridden")
	}
}
func TestDomainsOnlyForHTTP(t *testing.T) {
	for _, kind := range []string{"", "http", "dns", "tls"} {
		source := "acme:\n  type: " + kind + "\n  domains: [core.example.com]\n"
		domains, err := acmehttp.Domains(source)
		if err != nil {
			t.Fatal(err)
		}
		if kind == "dns" || kind == "tls" {
			if len(domains) != 0 {
				t.Fatal(domains)
			}
		} else if len(domains) != 1 {
			t.Fatal(domains)
		}
	}
}
