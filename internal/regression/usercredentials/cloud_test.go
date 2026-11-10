package usercredentials_test

import (
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestCloudEqualityKeepsHTTPStatusAndMessage(t *testing.T) {
	app := testutil.New(t)
	response := httptest.NewRecorder()
	app.Auth.CloudSettings(response, testutil.Request("PUT", "/api/admin/cloud-password", `{"currentPassword":"a-long-test-password","password":"a-long-test-password"}`))
	var result struct {
		Error string `json:"error"`
	}
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}
	if response.Code != 400 || result.Error != "Облачный пароль должен отличаться от основного" {
		t.Fatalf("status=%d error=%q", response.Code, result.Error)
	}
}

func TestStoreKeepsPrimaryAndCloudPasswordsDistinct(t *testing.T) {
	const primary = "primary-fixture-password"
	const cloud = "cloud-fixture-password"
	hash, err := bcrypt.GenerateFromPassword([]byte(primary), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	directory := t.TempDir()
	store, err := credentials.New("admin", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.ChangeCloud("", primary); err == nil {
		t.Fatal("primary password accepted as cloud password")
	}
	if store.HasCloudPassword() {
		t.Fatal("rejected change enabled cloud password")
	}
	if err := store.ChangeCloud("", cloud); err != nil {
		t.Fatal(err)
	}
	if err := store.Change(primary, "changed", cloud); err == nil {
		t.Fatal("cloud password accepted as primary password")
	}
	if !store.Verify("admin", primary) || !store.VerifyCloud(cloud) {
		t.Fatal("rejected change altered credentials")
	}
	restored, err := credentials.New("ignored", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if !restored.Verify("admin", primary) || !restored.VerifyCloud(cloud) {
		t.Fatal("rejected change was persisted")
	}
	if err := restored.ChangeCloud(cloud, ""); err != nil {
		t.Fatal(err)
	}
	if err := restored.Change(primary, "admin", cloud); err != nil {
		t.Fatal("removed cloud password should be reusable", err)
	}
}
