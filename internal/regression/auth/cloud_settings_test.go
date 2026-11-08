package auth_test

import (
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCloudSettingsRejectInvalidChangesAndDoNotExposeHash(t *testing.T) {
	app := testutil.New(t)
	for _, body := range []string{
		`{"currentPassword":"wrong","password":"` + cloudSecret + `"}`,
		`{"currentPassword":"` + mainSecret + `","password":"short"}`,
		`{"currentPassword":"` + mainSecret + `","password":"` + mainSecret + `"}`,
	} {
		response := httptest.NewRecorder()
		app.Auth.CloudSettings(response, testutil.Request("PUT", "/api/admin/cloud-password", body))
		if response.Code != 400 || app.Auth.Credentials.HasCloudPassword() {
			t.Fatal("invalid cloud setting accepted")
		}
	}
	enableCloud(t, app)
	response := httptest.NewRecorder()
	app.Auth.CloudSettings(response, testutil.Request("GET", "/api/admin/cloud-password", ""))
	if response.Code != 200 || strings.Contains(response.Body.String(), "hash") || strings.Contains(response.Body.String(), cloudSecret) {
		t.Fatal("settings exposed credential data")
	}
	response = httptest.NewRecorder()
	app.Auth.CloudSettings(response, testutil.Request("PUT", "/api/admin/cloud-password", `{"currentPassword":"`+mainSecret+`","password":""}`))
	if response.Code != 400 || !app.Auth.Credentials.HasCloudPassword() {
		t.Fatal("cloud password disabled without current cloud password")
	}
}

func TestCloudPersistenceCredentialChangeAndRootReset(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte(mainSecret), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	directory := t.TempDir()
	store, err := credentials.New("admin", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.ChangeCloud("", cloudSecret); err != nil {
		t.Fatal(err)
	}
	if err := store.Change(mainSecret, "owner", "changed-main-password-only"); err != nil {
		t.Fatal(err)
	}
	reloaded, err := credentials.New("ignored", hash, directory)
	if err != nil || !reloaded.VerifyCloud(cloudSecret) || !reloaded.Verify("owner", "changed-main-password-only") {
		t.Fatal("cloud password lost during account change or restart", err)
	}
	if err := credentials.ResetCloud(directory); err != nil {
		t.Fatal(err)
	}
	reloaded, err = credentials.New("ignored", hash, directory)
	if err != nil || reloaded.HasCloudPassword() || !reloaded.Verify("owner", "changed-main-password-only") {
		t.Fatal("root reset changed primary credentials", err)
	}
}
