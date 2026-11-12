package certificates_test

import (
	"hy2-panel/internal/certificates/files"
	"hy2-panel/internal/certificates/management"
	"os"
	"path/filepath"
	"testing"
)

func TestCertificateRemovalChecksEveryInstanceAndKeepsAccounts(t *testing.T) {
	data := t.TempDir()
	source := "acme:\n  domains: [vpn.example.com]\n"
	current := filepath.Join(data, "acme-hy2", "vpn.example.com.crt")
	stale := filepath.Join(data, "acme-hy2", "old.example.com.crt")
	writeCertificate(t, current, "vpn.example.com", false)
	writeCertificate(t, stale, "old.example.com", false)
	for _, path := range []string{stale[:len(stale)-4] + ".key", stale[:len(stale)-4] + ".json", filepath.Join(data, "acme-hy2", "account.key")} {
		if err := os.WriteFile(path, []byte("private-test-fixture"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	references := []management.Reference{{Source: source, Data: data, Running: true}, {Source: "acme:\n  domains: [old.example.com]\n", Data: data, Running: true}}
	_, entries, err := management.List(source, data, references)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if !entry.InUse || entry.CanDelete {
			t.Fatalf("running certificate exposed as removable: %+v", entry)
		}
		if err := management.Remove(data, entry); err == nil {
			t.Fatal("removed an active certificate")
		}
	}
	_, entries, err = management.List(source, data, references[:1])
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if filepath.FromSlash(entry.Path) != stale {
			continue
		}
		if !entry.CanDelete || entry.InUse {
			t.Fatalf("unused certificate is not removable: %+v", entry)
		}
		if err := management.Remove(data, entry); err != nil {
			t.Fatal(err)
		}
	}
	for _, path := range []string{stale, stale[:len(stale)-4] + ".key", stale[:len(stale)-4] + ".json"} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("bundle member remains: %s", path)
		}
	}
	for _, path := range []string{current, filepath.Join(data, "acme-hy2", "account.key")} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("unrelated or active file removed: %s", path)
		}
	}
}

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
