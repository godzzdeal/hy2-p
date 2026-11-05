package gateway_test

import (
	"hy2-panel/internal/acmehttp/gateway"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestOwnTokenPrecedesCoreAndMissingTokensFallback(t *testing.T) {
	coreCalls := 0
	handler := gateway.Handler{
		Web: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasSuffix(r.URL.Path, "web-token") {
				w.Header().Set("X-Issuer", "web")
				w.Write([]byte("web-proof"))
				return
			}
			if r.Host == "core.example.com" {
				w.WriteHeader(403)
			} else {
				http.NotFound(w, r)
			}
		}),
		Core: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			coreCalls++
			w.Header().Set("X-Issuer", "core")
			w.Write([]byte("core-proof"))
		}),
		Allowed: func(host string) bool { return host == "web.example.com" || host == "core.example.com" },
	}
	for _, test := range []struct {
		host, token, issuer string
		status              int
	}{
		{"web.example.com", "web-token", "web", 200},
		{"web.example.com", "core-token", "core", 200},
		{"core.example.com", "core-token", "core", 200},
		{"unknown.example.com", "core-token", "", 404},
	} {
		request := httptest.NewRequest("GET", "http://"+test.host+"/.well-known/acme-challenge/"+test.token, nil)
		writer := httptest.NewRecorder()
		handler.ServeHTTP(writer, request)
		if writer.Code != test.status || writer.Header().Get("X-Issuer") != test.issuer {
			t.Fatalf("%+v: %d %s", test, writer.Code, writer.Body.String())
		}
	}
	if coreCalls != 2 {
		t.Fatal("unknown host reached the core")
	}
	for _, path := range []string{"/api/admin/account", "/.well-known/acme-challenge/../auth", "/.well-known/acme-challenge/a/b", "/.well-known/acme-challenge/"} {
		writer := httptest.NewRecorder()
		handler.ServeHTTP(writer, httptest.NewRequest("GET", "http://web.example.com"+path, nil))
		if writer.Code != 404 {
			t.Fatal("non-challenge request exposed")
		}
	}
	writer := httptest.NewRecorder()
	handler.ServeHTTP(writer, httptest.NewRequest("POST", "http://web.example.com/.well-known/acme-challenge/token", nil))
	if writer.Code != 404 || coreCalls != 2 {
		t.Fatal("invalid request forwarded")
	}
}
