package integration

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/oauth"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"hy2-panel/internal/cloudbackup/service"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
)

type tokenTransport func(*http.Request) (*http.Response, error)

func (transport tokenTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport(request)
}

func tokenEndpoint(t *testing.T, host string, handler http.HandlerFunc) {
	t.Helper()
	endpoint := httptest.NewTLSServer(handler)
	t.Cleanup(endpoint.Close)
	target, _ := url.Parse(endpoint.URL)
	previous := http.DefaultTransport
	http.DefaultTransport = tokenTransport(func(request *http.Request) (*http.Response, error) {
		if request.URL.Host != host {
			t.Errorf("unexpected token destination: %s", request.URL.Host)
		}
		clone := request.Clone(request.Context())
		clone.URL.Scheme, clone.URL.Host = target.Scheme, target.Host
		return endpoint.Client().Transport.RoundTrip(clone)
	})
	t.Cleanup(func() { http.DefaultTransport = previous })
}

func TestAuthorizationPKCEAndReplay(t *testing.T) {
	var expectedChallenge string
	var exchanges int
	tokenEndpoint(t, "oauth.yandex.ru", func(writer http.ResponseWriter, request *http.Request) {
		exchanges++
		if err := request.ParseForm(); err != nil {
			t.Error(err)
			writer.WriteHeader(400)
			return
		}
		challenge := sha256.Sum256([]byte(request.Form.Get("code_verifier")))
		if request.Form.Get("code") != "provider-code" || request.Form.Get("client_secret") != "APP-PRIVATE" || base64.RawURLEncoding.EncodeToString(challenge[:]) != expectedChallenge {
			writer.WriteHeader(400)
			return
		}
		json.NewEncoder(writer).Encode(oauth.Credentials{AccessToken: "PRIVATE-ACCESS", RefreshToken: "PRIVATE-REFRESH", ExpiresIn: 3600})
	})
	root := t.TempDir()
	if err := apps.Save(root, apps.Application{Provider: "yandex", ClientID: "test-app", Secret: "APP-PRIVATE", Origin: "https://panel.example.invalid"}); err != nil {
		t.Fatal(err)
	}
	handler := (&service.Service{Root: root, Mu: &sync.Mutex{}, IsBusy: func() bool { return false }}).Handler
	response := call(t, handler, http.MethodPost, accounts.Input{Action: "authorize", Provider: "yandex", Name: "Yandex", Folder: "HY2-P", Origin: "https://panel.example.invalid"})
	var authorization oauth.Authorization
	if err := json.Unmarshal(response.Body.Bytes(), &authorization); err != nil {
		t.Fatal(err)
	}
	address, err := url.Parse(authorization.URL)
	if err != nil {
		t.Fatal(err)
	}
	expectedChallenge = address.Query().Get("code_challenge")
	if response.Code != 200 || strings.Contains(response.Body.String(), "PRIVATE") || expectedChallenge == "" || address.Query().Get("redirect_uri") != "https://panel.example.invalid/connect/callback/yandex" {
		t.Fatalf("authorize: %d %s", response.Code, response.Body.String())
	}
	response = call(t, handler, http.MethodPost, accounts.Input{Action: "complete", State: authorization.State, Code: "provider-code"})
	if response.Code != 200 || strings.Contains(response.Body.String(), "PRIVATE") {
		t.Fatalf("complete: %d %s", response.Code, response.Body.String())
	}
	if call(t, handler, http.MethodPost, accounts.Input{Action: "complete", State: authorization.State, Code: "provider-code"}).Code == 200 || exchanges != 1 {
		t.Fatal("authorization replay accepted")
	}
	response = call(t, handler, http.MethodPost, accounts.Input{Action: "providers"})
	if strings.Contains(response.Body.String(), "APP-PRIVATE") {
		t.Fatal("provider secret returned")
	}
	catalog, err := accounts.Read(root)
	if err != nil || len(catalog.Accounts) != 1 || catalog.Accounts[0].Token.RefreshToken != "PRIVATE-REFRESH" {
		t.Fatal("token not stored privately")
	}
}

func TestApplicationSecretRetentionAndOriginValidation(t *testing.T) {
	root := t.TempDir()
	application := apps.Application{Provider: "google", ClientID: "test-app", Secret: "PRIVATE", Origin: "https://panel.example.invalid"}
	if err := apps.Save(root, application); err != nil {
		t.Fatal(err)
	}
	application.Secret = ""
	if err := apps.Save(root, application); err != nil {
		t.Fatal(err)
	}
	stored, err := apps.Get(root, "google")
	if err != nil || stored.Secret != "PRIVATE" {
		t.Fatal("saved secret lost")
	}
	for _, origin := range []string{"http://panel.example.invalid", "https://user:pass@panel.invalid", "javascript:alert(1)", "https://panel.invalid/other", "https://panel.invalid?next=evil"} {
		application.Origin = origin
		if apps.Save(root, application) == nil {
			t.Fatalf("accepted origin: %s", origin)
		}
	}
}
