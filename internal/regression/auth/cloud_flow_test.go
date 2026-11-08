package auth_test

import (
	"encoding/json"
	"hy2-panel/internal/testutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

const cloudSecret = "dummy-cloud-password-only"
const mainSecret = "a-long-test-password"

func enableCloud(t *testing.T, app *testutil.Application) {
	t.Helper()
	response := httptest.NewRecorder()
	app.Auth.CloudSettings(response, testutil.Request("PUT", "/api/admin/cloud-password", `{"currentPassword":"`+mainSecret+`","password":"`+cloudSecret+`"}`))
	if response.Code != 200 {
		t.Fatal(response.Body.String())
	}
}

func cloudTicket(t *testing.T, app *testutil.Application) string {
	t.Helper()
	response := httptest.NewRecorder()
	app.Auth.Login(response, testutil.Request("POST", "/api/login", `{"username":"admin","password":"`+mainSecret+`"}`))
	var value struct {
		OK        bool   `json:"ok"`
		Required  bool   `json:"cloudPasswordRequired"`
		Challenge string `json:"challenge"`
	}
	if response.Code != 200 || json.Unmarshal(response.Body.Bytes(), &value) != nil || value.OK || !value.Required || value.Challenge == "" || len(response.Result().Cookies()) != 0 {
		t.Fatal("primary password issued session or missing challenge", response.Body.String())
	}
	return value.Challenge
}

func TestCloudPasswordRequiresBothSteps(t *testing.T) {
	app := testutil.New(t)
	enableCloud(t, app)
	ticket := cloudTicket(t, app)
	wrong := httptest.NewRecorder()
	app.Auth.CloudLogin(wrong, testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"wrong"}`))
	if wrong.Code != 401 || len(wrong.Result().Cookies()) != 0 {
		t.Fatal("wrong cloud password accepted")
	}
	missingHeader := testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"`+cloudSecret+`"}`)
	missingHeader.Header.Del("X-Panel-Request")
	csrf := httptest.NewRecorder()
	app.Auth.CloudLogin(csrf, missingHeader)
	if csrf.Code != 403 {
		t.Fatal("cloud login lacks CSRF guard")
	}
	valid := httptest.NewRecorder()
	app.Auth.CloudLogin(valid, testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"`+cloudSecret+`"}`))
	if valid.Code != 200 || len(valid.Result().Cookies()) != 1 {
		t.Fatal(valid.Body.String())
	}
	request := testutil.Request("GET", "/api/session", "")
	request.AddCookie(valid.Result().Cookies()[0])
	protected := app.Auth.Protect(func(writer http.ResponseWriter, _ *http.Request) { writer.WriteHeader(204) })
	result := httptest.NewRecorder()
	protected(result, request)
	if result.Code != 204 {
		t.Fatal("completed login rejected")
	}
	replay := httptest.NewRecorder()
	app.Auth.CloudLogin(replay, testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"`+cloudSecret+`"}`))
	if replay.Code != 410 || len(replay.Result().Cookies()) != 0 {
		t.Fatal("challenge replay issued a session")
	}
}

func TestCloudAttemptsAndRevocation(t *testing.T) {
	app := testutil.New(t)
	enableCloud(t, app)
	ticket := cloudTicket(t, app)
	for index := 0; index < 6; index++ {
		response := httptest.NewRecorder()
		app.Auth.CloudLogin(response, testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"wrong"}`))
		if index < 5 && response.Code != 401 || index == 5 && response.Code != 410 {
			t.Fatalf("attempt %d: %d", index, response.Code)
		}
	}
	ticket = cloudTicket(t, app)
	disabled := httptest.NewRecorder()
	app.Auth.CloudSettings(disabled, testutil.Request("PUT", "/api/admin/cloud-password", `{"currentPassword":"`+mainSecret+`","currentCloudPassword":"`+cloudSecret+`","password":""}`))
	if disabled.Code != 200 || app.Auth.Credentials.HasCloudPassword() {
		t.Fatal(disabled.Body.String())
	}
	response := httptest.NewRecorder()
	app.Auth.CloudLogin(response, testutil.Request("POST", "/api/login/cloud", `{"challenge":"`+ticket+`","password":"`+cloudSecret+`"}`))
	if response.Code != 410 {
		t.Fatal("pending login survived settings change")
	}
}
