package integration

import (
	"bytes"
	"encoding/json"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/lock"
	"hy2-panel/internal/cloudbackup/service"
	"hy2-panel/internal/records"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

func call(t *testing.T, handler http.HandlerFunc, method string, input any) *httptest.ResponseRecorder {
	t.Helper()
	payload, err := json.Marshal(input)
	if err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	handler(response, httptest.NewRequest(method, "/", bytes.NewReader(payload)))
	return response
}

func TestMultipleStoragesPrivateCredentialsAndDisconnect(t *testing.T) {
	root := t.TempDir()
	busy := false
	handler := (&service.Service{Root: root, Mu: &sync.Mutex{}, IsBusy: func() bool { return busy }}).Handler
	legacy := map[string]string{"destination": "old:Backups", "configText": "[old]\ntype = yandex\ntoken = LEGACY-PRIVATE"}
	if err := records.Write(filepath.Join(root, "cloud-backup"), "settings", legacy); err != nil {
		t.Fatal(err)
	}
	input := accounts.Input{Action: "create", Name: "Organization S3", Provider: "s3", Folder: "bucket/HY2-P", Endpoint: "https://s3.example.invalid", AccessKey: "ACCESS-PRIVATE", SecretKey: "SECRET-PRIVATE"}
	response := call(t, handler, http.MethodPost, input)
	if response.Code != 200 || strings.Contains(response.Body.String(), "PRIVATE") {
		t.Fatalf("create: %d %s", response.Code, response.Body.String())
	}
	var summaries []accounts.Summary
	if err := json.Unmarshal(response.Body.Bytes(), &summaries); err != nil || len(summaries) != 2 {
		t.Fatalf("migration: %v %s", err, response.Body.String())
	}
	stored, err := accounts.Read(root)
	if err != nil || len(stored.Accounts) != 2 || !strings.Contains(stored.Accounts[1].ConfigText, "SECRET-PRIVATE") {
		t.Fatal("credentials not persisted")
	}
	paths, _ := filepath.Glob(filepath.Join(root, "cloud-backup", "accounts-*.json"))
	info, err := os.Stat(paths[0])
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm()&0077 != 0 && os.PathSeparator != '\\' {
		t.Fatal("credentials permissions")
	}
	busy = true
	if call(t, handler, http.MethodPost, accounts.Input{Action: "delete", ID: summaries[1].ID}).Code == 200 {
		t.Fatal("deleted during maintenance")
	}
	busy = false
	release, err := lock.Acquire(root)
	if err != nil {
		t.Fatal(err)
	}
	if call(t, handler, http.MethodPost, accounts.Input{Action: "delete", ID: summaries[1].ID}).Code == 200 {
		t.Fatal("deleted during manual CLI backup")
	}
	release()
	if call(t, handler, http.MethodPost, accounts.Input{Action: "delete", ID: summaries[1].ID}).Code != 200 {
		t.Fatal("disconnect failed")
	}
	paths, _ = filepath.Glob(filepath.Join(root, "cloud-backup", "*.json"))
	for _, path := range paths {
		data, _ := os.ReadFile(path)
		if bytes.Contains(data, []byte("SECRET-PRIVATE")) {
			t.Fatal("disconnected credential retained")
		}
	}
	if call(t, handler, http.MethodPost, accounts.Input{Action: "delete", ID: accounts.LegacyID}).Code != 200 {
		t.Fatal("legacy disconnect failed")
	}
	stored, err = accounts.Read(root)
	if err != nil || len(stored.Accounts) != 0 {
		t.Fatal("legacy connection resurrected")
	}
}

func TestRejectConfigurationInjection(t *testing.T) {
	base := accounts.Input{Name: "Storage", Provider: "webdav", Endpoint: "https://cloud.example.invalid/dav", Username: "admin", Password: "secret", Folder: "HY2-P"}
	for _, change := range []func(*accounts.Input){
		func(input *accounts.Input) { input.Endpoint = "https://cloud.invalid\n[host]\ntype=local" },
		func(input *accounts.Input) { input.Username = "user\nurl=http://evil.invalid" },
		func(input *accounts.Input) { input.Folder = "../backups" },
		func(input *accounts.Input) { input.Endpoint = "http://cloud.invalid" },
		func(input *accounts.Input) { input.Endpoint = "https://user:password@cloud.invalid" },
	} {
		input := base
		change(&input)
		if accounts.Validate(input) == nil {
			t.Fatalf("accepted invalid input: %#v", input)
		}
	}
}
