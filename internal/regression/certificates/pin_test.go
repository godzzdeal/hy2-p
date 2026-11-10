package certificates_test

import (
	"fmt"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/users"
	"net/url"
	"path/filepath"
	"testing"
)

func TestAutomaticPinFollowsCertificateReplacement(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "server.crt")
	expected := writeCertificate(t, path, "vpn.example.com", false)
	settings := configuration.Settings{Host: "vpn.example.com", Port: "443", SNI: "vpn.example.com", PinFromCertificate: true, Config: fmt.Sprintf("tls:\n  cert: %q\n", path)}
	for index := 0; index < 2; index++ {
		raw, err := subscriptions.ConnectionURI(settings, users.User{Password: "secret"}, directory)
		if err != nil {
			t.Fatal(err)
		}
		uri, err := url.Parse(raw)
		if err != nil || uri.Query().Get("pinSHA256") != expected || uri.Query().Has("insecure") {
			t.Fatalf("automatic pin: %s %v", raw, err)
		}
		expected = writeCertificate(t, path, "vpn.example.com", false)
	}
}
