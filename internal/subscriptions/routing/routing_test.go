package routing

import (
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"
)

func TestRoutingProfileUsesProxyByDefault(t *testing.T) {
	settings, err := Normalize(Settings{Enabled: true, Domains: []string{"Example.COM", "*.пример.рф", "example.com", ""}, HasProfile: true})
	if err != nil {
		t.Fatal(err)
	}
	if len(settings.Domains) != 2 || settings.Domains[1] != "xn--e1afmkfd.xn--p1ai" {
		t.Fatal(settings)
	}
	link := Link(settings)
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(link, "happ://routing/onadd/"))
	if err != nil {
		t.Fatal(err)
	}
	var profile Profile
	if err = json.Unmarshal(data, &profile); err != nil {
		t.Fatal(err)
	}
	if profile.GlobalProxy != "true" || profile.DirectSites[0] != "domain:example.com" || profile.DomainStrategy != "AsIs" || !profile.UseChunkFiles {
		t.Fatal(profile)
	}
	if len(profile.ProxySites)+len(profile.ProxyIP)+len(profile.BlockSites)+len(profile.BlockIP) != 0 {
		t.Fatal("unexpected routing rules")
	}
	if strings.Contains(string(data), "LastUpdated") {
		t.Fatal("domain changes must not force geofile downloads")
	}
	if len(link) > 4096 {
		t.Fatal("oversized header")
	}
}
func TestRejectUnsafeAndOversizedDomainLists(t *testing.T) {
	for _, value := range []string{"https://example.com", "example.com/path", "example.com:443", "127.0.0.1", "*.com/", "x..com", "x.com\r\nInjected: yes", "a*.com", "-a.com"} {
		if _, err := Normalize(Settings{Enabled: true, Domains: []string{value}}); err == nil {
			t.Fatal(value)
		}
	}
	if _, err := Normalize(Settings{Enabled: true}); err == nil {
		t.Fatal("empty enabled routing")
	}
	if _, err := Normalize(Settings{Domains: make([]string, MaxDomains+1)}); err == nil {
		t.Fatal("domain count limit ignored")
	}
	domains := []string{}
	for count := 0; count < MaxDomains; count++ {
		domains = append(domains, strings.Repeat("a", count+1)+".example.com")
	}
	if _, err := Normalize(Settings{Domains: domains}); err == nil {
		t.Fatal("header budget ignored")
	}
}
func TestDefaultAndExplicitDisable(t *testing.T) {
	if Link(Settings{}) != "" {
		t.Fatal("untouched setting must not override personal routing")
	}
	if Link(Settings{HasProfile: true}) != "happ://routing/off" {
		t.Fatal("previous profile must be disabled explicitly")
	}
}
