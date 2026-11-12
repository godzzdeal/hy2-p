package aclfiles_test

import (
	"context"
	"hy2-panel/internal/aclfiles"
	"net/netip"
	"testing"
)

func TestDownloadRejectsLocalAndServiceAddresses(t *testing.T) {
	for _, raw := range []string{"127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "64:ff9b::a00:1", "0.0.0.1", "240.0.0.1"} {
		if aclfiles.IsPublic(netip.MustParseAddr(raw)) {
			t.Fatalf("service IP allowed: %s", raw)
		}
	}
	for _, raw := range []string{"8.8.8.8", "2606:4700:4700::1111"} {
		if !aclfiles.IsPublic(netip.MustParseAddr(raw)) {
			t.Fatalf("public address blocked: %s", raw)
		}
	}
	if _, err := aclfiles.Download(context.Background(), t.TempDir(), "geoip", "https://127.0.0.1/private"); err == nil {
		t.Fatal("localhost download allowed")
	}
}

func TestDownloadURLRejectsCredentialsAndUnexpectedProtocols(t *testing.T) {
	for _, raw := range []string{"http://example.com/a", "file:///etc/passwd", "https://user:secret@example.com/a", "https://example.com:8443/a", "https://example.com/a#fragment"} {
		if aclfiles.ValidateURL(raw) == nil {
			t.Fatalf("URL accepted: %s", raw)
		}
	}
	if err := aclfiles.ValidateURL("https://example.com/rules.dat"); err != nil {
		t.Fatal(err)
	}
}
