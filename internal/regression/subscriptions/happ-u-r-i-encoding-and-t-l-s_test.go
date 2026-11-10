package subscriptions_test

import (
	"encoding/pem"
	"fmt"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/users"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHappURIEncodingAndTLS(t *testing.T) {
	s := configuration.Settings{Host: "2001:db8::1", Port: "8443", SNI: "tls.example.com", Config: "tls:\n  cert: test\n  key: test\nobfs:\n  type: salamander\n  salamander:\n    password: 'a & b'\n"}
	u := users.User{Name: "👩🏽‍💻 Телефон #1", Password: "secret:@/?"}
	raw, e := subscriptions.ConnectionURI(s, u, "")
	if e != nil {
		t.Fatal(e)
	}
	uri, e := url.Parse(raw)
	if e != nil {
		t.Fatal(e)
	}
	if uri.Scheme != "hy2" || uri.User.Username() != u.Password || uri.Host != "[2001:db8::1]:8443" || uri.Fragment != u.Name {
		t.Fatal(raw)
	}
	if uri.Query().Get("obfs-password") != "a & b" || uri.Query().Get("sni") != s.SNI || uri.Query().Get("insecure") != "" {
		t.Fatal(raw)
	}
	s.Config = "tls: {}\nobfs:\n  type: gecko\n"
	if _, e = subscriptions.ConnectionURI(s, u, ""); e == nil {
		t.Fatal("unsupported Happ obfs silently exported")
	}
}

func TestCertificatePinURIEncoding(t *testing.T) {
	settings := configuration.Settings{Host: "vpn.example.com", Port: "443", PinSHA256: strings.Repeat("AB:", 31) + "AB", Config: "tls: {}\n"}
	raw, err := subscriptions.ConnectionURI(settings, users.User{Password: "secret"}, "")
	if err != nil {
		t.Fatal(err)
	}
	uri, err := url.Parse(raw)
	if err != nil || uri.Query().Get("pinSHA256") != strings.Repeat("ab", 32) || uri.Query().Has("insecure") {
		t.Fatalf("invalid pin export: %s, %v", raw, err)
	}
	settings.PinSHA256 = ":"
	if _, err := subscriptions.ConnectionURI(settings, users.User{}, ""); err == nil {
		t.Fatal("invalid pin silently omitted")
	}
	settings.PinSHA256 = ""
	raw, err = subscriptions.ConnectionURI(settings, users.User{}, "")
	if err != nil {
		t.Fatal(err)
	}
	uri, _ = url.Parse(raw)
	if uri.Query().Has("pinSHA256") {
		t.Fatal("empty pin exported")
	}
}

func TestECHURIExportsOnlyPublicConfig(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ech.pem")
	private := pem.EncodeToMemory(&pem.Block{Type: "ECH KEYS", Bytes: []byte("private-key-never-exported")})
	public := pem.EncodeToMemory(&pem.Block{Type: "ECH CONFIGS", Bytes: []byte{0, 3, 251, 255, 255}})
	if err := os.WriteFile(path, append(private, public...), 0600); err != nil {
		t.Fatal(err)
	}
	settings := configuration.Settings{Host: "vpn.example.com", Port: "443", Config: fmt.Sprintf("ech:\n  keyPath: %q\n", path)}
	raw, err := subscriptions.ConnectionURI(settings, users.User{Name: "Phone", Password: "password"}, "")
	if err != nil {
		t.Fatal(err)
	}
	uri, err := url.Parse(raw)
	if err != nil || uri.Query().Get("ech") != "AAP7//8=" || strings.Contains(raw, "private-key") || strings.Contains(raw, "ech.pem") {
		t.Fatalf("ECH URI: %s, error: %v", raw, err)
	}
	if err := os.WriteFile(path, private, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := subscriptions.ConnectionURI(settings, users.User{}, ""); err == nil {
		t.Fatal("private-only ECH file was exported")
	}
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if _, err := subscriptions.ConnectionURI(settings, users.User{}, ""); err == nil {
		t.Fatal("missing ECH configuration silently dropped")
	}
}
