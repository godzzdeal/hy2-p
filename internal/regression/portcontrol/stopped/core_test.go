package stopped_test

import (
	"hy2-panel/internal/core"
	portweb "hy2-panel/internal/portcontrol/web"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestStoppedCoreDoesNotBlockPortPublication(t *testing.T) {
	t.Setenv("PANEL_CONTAINER", "true")
	t.Setenv("HYSTERIA_BIN", "missing-port-test-binary")
	app := testutil.New(t)
	runtime, err := core.New(app.DB, app.Config, t.TempDir(), "fixture")
	if err != nil {
		t.Fatal(err)
	}
	handler := &portweb.Handler{Config: app.Config, Core: runtime}
	response := httptest.NewRecorder()
	handler.Apply(response, testutil.Request("POST", "/api/deployment/udp", `{"publicPort":"8443","listenPort":"8443"}`))
	// No host helper is installed here. Reaching its 503 proves the stopped-core
	// gate passed, while an unhealthy core with running intent must still fail.
	if response.Code != 503 {
		t.Fatal(response.Code, response.Body.String())
	}
	runtime.Watchdog.SetDesired(true)
	response = httptest.NewRecorder()
	handler.Apply(response, testutil.Request("POST", "/api/deployment/udp", `{"publicPort":"8443","listenPort":"8443"}`))
	if response.Code != 409 {
		t.Fatal("crashed core bypassed safety gate", response.Code)
	}
}
