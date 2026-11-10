package certificates_test

import (
	"hy2-panel/internal/certificates/files"
	"path/filepath"
	"testing"
)

func TestAutomaticPinUsesInstanceACMECacheAndSNI(t *testing.T) {
	directory := t.TempDir()
	source := "acme:\n  domains: [vpn.example.com]\n"
	if _, err := files.FromConfig(source, directory, "vpn.example.com"); err == nil {
		t.Fatal("missing certificate accepted")
	}
	path := filepath.Join(directory, "acme-hy2", "certificates", "vpn.example.com.crt")
	expected := writeCertificate(t, path, "vpn.example.com", false)
	writeCertificate(t, filepath.Join(directory, "acme-hy2", "other.crt"), "other.example.com", false)
	writeCertificate(t, filepath.Join(directory, "acme-hy2", "expired.crt"), "vpn.example.com", true)
	pin, err := files.FromConfig(source, directory, "vpn.example.com")
	if err != nil || pin != expected {
		t.Fatalf("wrong ACME fingerprint: %s %v", pin, err)
	}
	writeCertificate(t, filepath.Join(directory, "acme-hy2", "ambiguous.crt"), "vpn.example.com", false)
	if _, err := files.FromConfig(source, directory, "vpn.example.com"); err == nil {
		t.Fatal("ambiguous certificate silently selected")
	}
}
