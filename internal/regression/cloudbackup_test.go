package regression_test

import (
	"encoding/json"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/service"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestSettingsHideTokensAndPreserveExistingConfig(t *testing.T) {
	root := t.TempDir()
	handler := (&service.Service{Root: root, Mu: new(sync.Mutex), IsBusy: func() bool { return false }}).Handler
	response := httptest.NewRecorder()
	handler(response, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"action":"create","name":"Disk","provider":"webdav","endpoint":"https://disk.example.invalid/dav","username":"admin","password":"PRIVATE","folder":"HY2-P"}`)))
	var summaries []accounts.Summary
	if response.Code != http.StatusOK || json.Unmarshal(response.Body.Bytes(), &summaries) != nil || len(summaries) != 1 {
		t.Fatal(response.Code, response.Body.String())
	}
	before, err := accounts.Read(root)
	if err != nil || len(before.Accounts) != 1 {
		t.Fatal("credentials not saved", err)
	}
	response = httptest.NewRecorder()
	body := `{"action":"update","id":"` + summaries[0].ID + `","name":"Renamed","folder":"new"}`
	handler(response, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)))
	if response.Code != http.StatusOK || strings.Contains(response.Body.String(), "PRIVATE") || strings.Contains(response.Body.String(), "configText") {
		t.Fatal(response.Code, response.Body.String())
	}
	after, err := accounts.Read(root)
	if err != nil || len(after.Accounts) != 1 || after.Accounts[0].ConfigText != before.Accounts[0].ConfigText || after.Accounts[0].Folder != "new" {
		t.Fatal("editing metadata changed credentials", err)
	}
	response = httptest.NewRecorder()
	handler(response, httptest.NewRequest(http.MethodGet, "/", nil))
	if response.Code != http.StatusOK || strings.Contains(response.Body.String(), "PRIVATE") || strings.Contains(response.Body.String(), "configText") {
		t.Fatal("secret exposed")
	}
}
func TestRejectInvalidTargets(t *testing.T) {
	for _, destination := range []string{"/tmp", ":local:/tmp", "--option", "disk:../other", "disk:path\n", "unknown:folder"} {
		if accounts.Validate(accounts.Input{Name: "Disk", Provider: "rclone", Destination: destination, ConfigText: "[disk]\ntype=yandex"}) == nil {
			t.Fatal(destination)
		}
	}
}
func TestBusySettingsCannotChange(t *testing.T) {
	root := t.TempDir()
	handler := (&service.Service{Root: root, Mu: new(sync.Mutex), IsBusy: func() bool { return true }}).Handler
	response := httptest.NewRecorder()
	handler(response, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"action":"create"}`)))
	if response.Code != http.StatusBadRequest {
		t.Fatal(response.Code)
	}
	catalog, err := accounts.Read(root)
	if err != nil || len(catalog.Accounts) != 0 {
		t.Fatal("settings changed during maintenance", err)
	}
}
