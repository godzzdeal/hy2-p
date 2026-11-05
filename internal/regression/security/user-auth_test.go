package security_test

import (
	"encoding/json"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCustomPasswordEncryptedAndRevokedOnChange(t *testing.T) {
	app := testutil.New(t)
	password := "initial-user-password"
	writer := httptest.NewRecorder()
	app.Users.Create(writer, testutil.Request("POST", "/users", `{"name":"Alice","password":"`+password+`"}`))
	if writer.Code != 201 {
		t.Fatal(writer.Body.String())
	}
	var user users.User
	if err := json.Unmarshal(writer.Body.Bytes(), &user); err != nil {
		t.Fatal(err)
	}
	var stored string
	if err := app.DB.QueryRow("SELECT password FROM users WHERE id=?", user.ID).Scan(&stored); err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(stored, "enc:v1:") || strings.Contains(stored, password) {
		t.Fatal("password not encrypted")
	}
	authenticate := func(password string) bool {
		result := httptest.NewRecorder()
		app.Users.Authenticate(result, testutil.Request("POST", "/auth", `{"auth":"`+password+`"}`))
		return strings.Contains(result.Body.String(), `"ok":true`)
	}
	if !authenticate(password) || authenticate("incorrect") {
		t.Fatal("custom auth failed")
	}
	duplicate := httptest.NewRecorder()
	app.Users.Create(duplicate, testutil.Request("POST", "/users", `{"name":"Bob","password":"`+password+`"}`))
	if duplicate.Code != 400 {
		t.Fatal("duplicate credential accepted")
	}
	kicked := false
	app.Users.Kick = func(id string) { kicked = id == user.ID }
	change := testutil.Request("PUT", "/users", `{"name":"Alice","enabled":true,"password":"replacement-user-password"}`)
	change.SetPathValue("id", user.ID)
	result := httptest.NewRecorder()
	app.Users.Edit(result, change)
	if result.Code != 200 || !kicked || authenticate(password) || !authenticate("replacement-user-password") {
		t.Fatal("password rotation failed", result.Body.String())
	}
	app.Users.Allow = func(string) bool { return false }
	if authenticate("replacement-user-password") {
		t.Fatal("exhausted quota accepted")
	}
}
