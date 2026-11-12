package regression_test

import (
	"hy2-panel/internal/cloudbackup"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestSettingsHideTokensAndPreserveExistingConfig(t *testing.T) {
	handler := cloudbackup.Host(t.TempDir(), new(sync.Mutex), func() bool { return false })
	for _, body := range []string{`{"destination":"disk:HY2-P","configText":"[disk]\ntype = yandex\ntoken = PRIVATE"}`, `{"destination":"disk:new"}`} {
		response := httptest.NewRecorder()
		handler(response, httptest.NewRequest(http.MethodPut, "/", strings.NewReader(body)))
		if response.Code != 200 || strings.Contains(response.Body.String(), "PRIVATE") || !strings.Contains(response.Body.String(), `"hasConfig":true`) {
			t.Fatal(response.Code, response.Body.String())
		}
	}
	response := httptest.NewRecorder()
	handler(response, httptest.NewRequest(http.MethodGet, "/", nil))
	if strings.Contains(response.Body.String(), "PRIVATE") || strings.Contains(response.Body.String(), "configText") {
		t.Fatal("secret exposed")
	}
}
func TestRejectInvalidTargets(t *testing.T) {
	for _, destination := range []string{"/tmp", ":local:/tmp", "--option", "disk:../other", "disk:path\n", "unknown:folder"} {
		if cloudbackup.Validate(cloudbackup.Config{Destination: destination, ConfigText: "[disk]\ntype=yandex"}) == nil {
			t.Fatal(destination)
		}
	}
}
func TestBusySettingsCannotChange(t *testing.T) {
	handler := cloudbackup.Host(t.TempDir(), new(sync.Mutex), func() bool { return true })
	response := httptest.NewRecorder()
	handler(response, httptest.NewRequest(http.MethodPut, "/", strings.NewReader(`{}`)))
	if response.Code != 409 {
		t.Fatal(response.Code)
	}
}
