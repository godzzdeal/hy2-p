package frontend

import (
	"hy2-panel/internal/transport"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProxyPreservesNonceCacheAndPublicOrigin(t *testing.T) {
	var headers http.Header
	backend := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		headers = request.Header.Clone()
		if request.Host != "panel.example" || request.URL.Path != "/_next/test.js" {
			t.Errorf("public request changed: %s %s", request.Host, request.URL)
		}
		writer.Header().Set("Content-Security-Policy", "script-src 'nonce-random'")
		writer.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		writer.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()
	client, err := New(backend.URL)
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodGet, "https://panel.example/_next/test.js", nil)
	request.Header.Set("X-Forwarded-Host", "attacker.example")
	request.Header.Set("X-Forwarded-For", "spoofed")
	result := httptest.NewRecorder()
	transport.Headers(client.Handler()).ServeHTTP(result, request)
	if len(result.Header().Values("Content-Security-Policy")) != 1 || result.Header().Get("Content-Security-Policy") != "script-src 'nonce-random'" {
		t.Fatal("Go CSP overrides Next nonce policy")
	}
	if result.Header().Get("Cache-Control") != "public, max-age=31536000, immutable" {
		t.Fatal("asset caching lost")
	}
	if headers.Get("X-Forwarded-Proto") != "https" || headers.Get("X-Forwarded-Host") != "panel.example" || headers.Get("X-Forwarded-For") == "spoofed" {
		t.Fatalf("untrusted forwarding headers: %v", headers)
	}
}

func TestHealthRequiresWorkingFrontend(t *testing.T) {
	status := http.StatusOK
	backend := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(status)
	}))
	defer backend.Close()
	client, err := New(backend.URL)
	if err != nil {
		t.Fatal(err)
	}
	for _, item := range []struct{ frontend, health int }{{200, 204}, {500, 503}, {302, 503}} {
		status = item.frontend
		result := httptest.NewRecorder()
		client.Health(result, httptest.NewRequest(http.MethodGet, "/health", nil))
		if result.Code != item.health {
			t.Fatalf("frontend %d: health %d", status, result.Code)
		}
	}
	backend.Close()
	result := httptest.NewRecorder()
	transport.Headers(client.Handler()).ServeHTTP(result, httptest.NewRequest(http.MethodGet, "/", nil))
	if result.Code != 503 || result.Header().Get("Cache-Control") != "no-store" {
		t.Fatal("unavailable frontend did not fail closed")
	}
}

func TestFrontendRejectsNonOriginURLs(t *testing.T) {
	for _, address := range []string{"file:///etc/passwd", "http://user:pass@host", "http://host/path", "http://host?next=host"} {
		if _, err := New(address); err == nil {
			t.Errorf("accepted %s", address)
		}
	}
}
