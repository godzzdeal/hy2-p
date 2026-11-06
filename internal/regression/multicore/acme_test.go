package multicore_test

import (
	"hy2-panel/internal/acmehttp/gateway/backends"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/profiles"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
)

func TestSameDomainChallengesReachTheirOwnCore(t *testing.T) {
	config := &configuration.Handler{Profile: &profiles.Store{Directory: t.TempDir()}}
	if err := config.Profile.Put(configuration.Settings{Config: "acme:\n  domains: [vpn.example.org]\n  type: http\n"}); err != nil {
		t.Fatal(err)
	}
	ports := []int{}
	for _, token := range []string{"first", "second"} {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			if request.Header.Get("Cookie") != "" || request.Header.Get("Authorization") != "" {
				t.Error("credentials forwarded")
			}
			if request.URL.Path != "/.well-known/acme-challenge/"+token {
				http.NotFound(writer, request)
				return
			}
			writer.Write([]byte(token + ".proof"))
		}))
		defer server.Close()
		_, port, _ := net.SplitHostPort(server.Listener.Addr().String())
		number, _ := strconv.Atoi(port)
		ports = append(ports, number)
	}
	handler := backends.Handler{Sources: func() []backends.Source {
		return []backends.Source{{Config: config, Port: ports[0]}, {Config: config, Port: ports[1]}}
	}}
	for _, token := range []string{"first", "second"} {
		request := httptest.NewRequest("GET", "http://vpn.example.org/.well-known/acme-challenge/"+token, nil)
		request.Header.Set("Cookie", "session=private")
		request.Header.Set("Authorization", "private")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != 200 || response.Body.String() != token+".proof" {
			t.Fatal(response.Code, response.Body.String())
		}
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest("GET", "http://other.example.org/.well-known/acme-challenge/first", nil))
	if response.Code != 404 {
		t.Fatal("unconfigured domain forwarded")
	}
}
