package firewall_test

import (
	"context"
	"hy2-panel/internal/firewall"
	"hy2-panel/internal/firewall/host"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestProtectedPortsCannotBeClosedOrMadePublic(t *testing.T) {
	fixture := setup(t)
	for _, port := range []int{22, 2222, 9443} {
		for _, action := range []string{"allow", "deny"} {
			if _, err := fixture.service.Change(context.Background(), firewall.Change{Port: port, Protocol: "tcp", Action: action}); err == nil {
				t.Fatal("protected port changed")
			}
		}
	}
	if len(fixture.calls) != 0 {
		t.Fatal("executed command for protected port")
	}
}
func TestDockerPublishedPortIsNotReportedAsBlocked(t *testing.T) {
	fixture := setup(t)
	fixture.output = func(string, []string) (string, error) { return "0.0.0.0:61254->8443/udp, [::]:61254->8443/udp", nil }
	_, err := fixture.service.Change(context.Background(), firewall.Change{Port: 61254, Protocol: "udp", Action: "deny"})
	if err == nil || !strings.Contains(err.Error(), "Docker") || len(fixture.calls) != 1 || fixture.calls[0].program != host.Docker {
		t.Fatal(err, fixture.calls)
	}
}
func TestInactiveUFWDoesNotChangeRules(t *testing.T) {
	fixture := setup(t)
	fixture.output = func(string, []string) (string, error) { return "Status: inactive", nil }
	_, err := fixture.service.Change(context.Background(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"})
	if err == nil || len(fixture.calls) != 1 {
		t.Fatal(err, fixture.calls)
	}
}
func TestInvalidRequestAndMissingGuardsNeverRunCommands(t *testing.T) {
	fixture := setup(t)
	for _, body := range []string{`{"port":true,"protocol":"tcp","action":"allow"}`, `{"port":80,"protocol":"tcp;id","action":"allow"}`, `{"port":80,"protocol":"tcp","action":"reset"}`, `[]`, `{"port":80,"protocol":"tcp","action":"allow","command":"id"}`} {
		response := httptest.NewRecorder()
		fixture.service.ServeHTTP(response, httptest.NewRequest("POST", "/firewall", strings.NewReader(body)))
		if response.Code != 409 || len(fixture.calls) != 0 {
			t.Fatal(response.Code, fixture.calls)
		}
	}
	if err := os.Remove(filepath.Join(fixture.service.Root, "firewall", "protected.json")); err != nil {
		t.Fatal(err)
	}
	if _, err := fixture.service.Change(context.Background(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err == nil || len(fixture.calls) != 0 {
		t.Fatal("missing guards accepted")
	}
}
