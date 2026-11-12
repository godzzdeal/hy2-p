package certificates_test

import (
	"fmt"
	"hy2-panel/internal/certificates/management"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/users"
	"net/url"
	"os"
	"path/filepath"
	"testing"
)

func TestCertificateRemovalRejectsExternalAndSymlinkFiles(t *testing.T) {
	data := t.TempDir()
	external := filepath.Join(t.TempDir(), "server.crt")
	writeCertificate(t, external, "external.example.com", false)
	source := "tls:\n  cert: " + filepath.ToSlash(external) + "\n"
	_, entries, err := management.List(source, data, nil)
	if err != nil || len(entries) != 1 {
		t.Fatalf("list external: %v", err)
	}
	if entries[0].CanDelete || management.Remove(data, entries[0]) == nil {
		t.Fatal("external certificate deletion allowed")
	}
	path := filepath.Join(data, "certificates", "server.crt")
	writeCertificate(t, path, "vpn.example.com", false)
	key := filepath.Join(filepath.Dir(path), "server.key")
	if err := os.Symlink(external, key); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	source = "tls:\n  cert: " + filepath.ToSlash(path) + "\n"
	_, entries, err = management.List(source, data, nil)
	if err != nil || len(entries) != 1 {
		t.Fatalf("list owned: %v", err)
	}
	if management.Remove(data, entries[0]) == nil {
		t.Fatal("symlinked private key deletion allowed")
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatal("certificate removed before unsafe key was rejected")
	}
	if _, err := os.Stat(external); err != nil {
		t.Fatal("external target removed")
	}
}

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
