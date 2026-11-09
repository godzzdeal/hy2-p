package recovery_test

import (
	"bytes"
	"encoding/json"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/auth/recovery"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRecoveryPreservesUsernameCloudPasswordAndNeverLogsNewPassword(t *testing.T) {
	data, hash := setup(t)
	directory := filepath.Join(data, "admin")
	store, err := credentials.New("ignored", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.ChangeCloud("", cloudPassword); err != nil {
		t.Fatal(err)
	}
	database := filepath.Join(data, "panel.db")
	if err := os.WriteFile(database, []byte("unchanged-fixture"), 0600); err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	if err := recovery.Reset(strings.NewReader(newPassword+"\n"), &output, data, "fallback"); err != nil {
		t.Fatal(err)
	}
	var result struct {
		Username         string
		HasCloudPassword bool
	}
	if err := json.Unmarshal(output.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result.Username != "operator" || !result.HasCloudPassword || strings.Contains(output.String(), newPassword) {
		t.Fatal("unsafe command output")
	}
	reopened, err := credentials.New("ignored", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if !reopened.Verify("operator", newPassword) || reopened.Verify("operator", oldPassword) || !reopened.VerifyCloud(cloudPassword) {
		t.Fatal("incorrect recovery state")
	}
	raw, err := os.ReadFile(database)
	if err != nil || string(raw) != "unchanged-fixture" {
		t.Fatal("VPN data changed")
	}
	files, err := filepath.Glob(filepath.Join(directory, "credentials-*.json"))
	if err != nil {
		t.Fatal(err)
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if bytes.Contains(data, []byte(newPassword)) {
			t.Fatal("plaintext password stored")
		}
	}
}
func TestInvalidRecoveryDoesNotChangeCredentials(t *testing.T) {
	data, hash := setup(t)
	for _, password := range []string{"", strings.Repeat("x", 15), strings.Repeat("x", 73), "password-with\nnew-line"} {
		var output bytes.Buffer
		if recovery.Reset(strings.NewReader(password), &output, data, "fallback") == nil || output.Len() != 0 {
			t.Fatal("invalid recovery accepted")
		}
		store, err := credentials.New("ignored", hash, filepath.Join(data, "admin"))
		if err != nil || !store.Verify("operator", oldPassword) {
			t.Fatal("existing credentials changed")
		}
	}
}
func TestFreshInstallationUsesConfiguredUsername(t *testing.T) {
	data := t.TempDir()
	var output bytes.Buffer
	if err := recovery.Reset(strings.NewReader(newPassword), &output, data, "configured-owner"); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(output.String(), "configured-owner") {
		t.Fatal("configured login lost")
	}
}
func TestRestartAfterRecoveryRejectsOldSessionsAndPassword(t *testing.T) {
	data, hash := setup(t)
	before, err := auth.Open(hash, false, data, "fallback")
	if err != nil {
		t.Fatal(err)
	}
	login := httptest.NewRecorder()
	before.Login(login, testutil.Request("POST", "/api/login", `{"username":"operator","password":"`+oldPassword+`"}`))
	if login.Code != 200 || len(login.Result().Cookies()) == 0 {
		t.Fatal("initial login failed")
	}
	var output bytes.Buffer
	if err := recovery.Reset(strings.NewReader(newPassword), &output, data, "fallback"); err != nil {
		t.Fatal(err)
	}
	after, err := auth.Open(hash, false, data, "fallback")
	if err != nil {
		t.Fatal(err)
	}
	session := testutil.Request("GET", "/api/session", "")
	session.AddCookie(login.Result().Cookies()[0])
	response := httptest.NewRecorder()
	after.Protect(after.Session)(response, session)
	if response.Code != 401 {
		t.Fatal("old session survived restart")
	}
	for _, entry := range []struct {
		Password string
		Code     int
	}{{oldPassword, 401}, {newPassword, 200}} {
		response = httptest.NewRecorder()
		after.Login(response, testutil.Request("POST", "/api/login", `{"username":"operator","password":"`+entry.Password+`"}`))
		if response.Code != entry.Code {
			t.Fatal("unexpected login result", response.Code)
		}
	}
}
