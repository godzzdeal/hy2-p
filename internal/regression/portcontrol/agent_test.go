package portcontrol_test

import (
	"hy2-panel/internal/portcontrol/agent"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestAgentRejectsUnknownCapabilitiesAndSerializesRequests(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("host helper runs on Linux")
	}
	root := t.TempDir()
	value, err := agent.New(root)
	if err != nil {
		t.Fatal(err)
	}
	handler := value.Handler()
	for _, body := range []string{
		`{"publicPort":"61254","listenPort":"61254","command":"anything"}`,
		`{"publicPort":"61254;sh","listenPort":"61254"}`,
	} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("POST", "/udp", strings.NewReader(body)))
		if recorder.Code != 400 {
			t.Fatalf("unsafe request accepted: %d", recorder.Code)
		}
	}
	// The accepted job cannot execute anything without a trusted current release.
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("POST", "/udp", strings.NewReader(`{"publicPort":"61254","listenPort":"61254"}`)))
	if recorder.Code != 202 {
		t.Fatal(recorder.Code)
	}
	second := httptest.NewRecorder()
	handler.ServeHTTP(second, httptest.NewRequest("POST", "/udp", strings.NewReader(`{"publicPort":"443","listenPort":"443"}`)))
	if second.Code != 409 {
		t.Fatal("parallel operation accepted")
	}
	if _, err = os.Stat(filepath.Join(root, "udp-operation.json")); err != nil {
		t.Fatal("job not persisted")
	}
}
