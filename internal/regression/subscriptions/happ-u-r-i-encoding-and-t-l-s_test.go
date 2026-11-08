package subscriptions_test

import (
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/users"
	"net/url"
	"testing"
)

func TestHappURIEncodingAndTLS(t *testing.T) {
	s := configuration.Settings{Host: "2001:db8::1", Port: "8443", SNI: "tls.example.com", Config: "tls:\n  cert: test\n  key: test\nobfs:\n  type: salamander\n  salamander:\n    password: 'a & b'\n"}
	u := users.User{Name: "👩🏽‍💻 Телефон #1", Password: "secret:@/?"}
	raw, e := subscriptions.ConnectionURI(s, u)
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
	if _, e = subscriptions.ConnectionURI(s, u); e == nil {
		t.Fatal("unsupported Happ obfs silently exported")
	}
}
