package auth_test

import (
	"hy2-panel/internal/testutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLoginSessionAndCSRF(t *testing.T) {
	a := testutil.New(t)
	w := httptest.NewRecorder()
	a.Auth.Login(w, testutil.Request("POST", "/api/login", `{"username":"admin","password":"wrong"}`))
	if w.Code != 401 {
		t.Fatalf("wrong password: %d", w.Code)
	}
	w = httptest.NewRecorder()
	a.Auth.Login(w, testutil.Request("POST", "/api/login", `{"username":"admin","password":"a-long-test-password"}`))
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	cookies := w.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly {
		t.Fatal("missing secure session cookie")
	}
	hit := false
	protected := a.Auth.Protect(func(w http.ResponseWriter, r *http.Request) { hit = true; w.WriteHeader(204) })
	r := testutil.Request("POST", "/api/test", "")
	r.AddCookie(cookies[0])
	r.Header.Del("X-Panel-Request")
	w = httptest.NewRecorder()
	protected(w, r)
	if w.Code != 403 || hit {
		t.Fatal("CSRF not blocked")
	}
	r = testutil.Request("GET", "/api/test", "")
	r.AddCookie(cookies[0])
	w = httptest.NewRecorder()
	protected(w, r)
	if w.Code != 204 || !hit {
		t.Fatal("valid session rejected")
	}
	a.Auth.Logout(httptest.NewRecorder(), r)
	w = httptest.NewRecorder()
	protected(w, r)
	if w.Code != 401 {
		t.Fatal("expired session accepted")
	}
}

func TestCredentialChangeInvalidatesSessions(t *testing.T) {
	app := testutil.New(t)
	login := httptest.NewRecorder()
	app.Auth.Login(login, testutil.Request("POST", "/api/login", `{"username":"admin","password":"a-long-test-password"}`))
	if login.Code != 200 {
		t.Fatal(login.Body.String())
	}
	cookie := login.Result().Cookies()[0]
	change := httptest.NewRecorder()
	app.Auth.ChangeAccount(change, testutil.Request("PUT", "/api/admin/account", `{"currentPassword":"a-long-test-password","username":"owner","password":"new-long-admin-password"}`))
	if change.Code != 200 {
		t.Fatal(change.Body.String())
	}
	protected := app.Auth.Protect(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) })
	request := testutil.Request("GET", "/api/session", "")
	request.AddCookie(cookie)
	result := httptest.NewRecorder()
	protected(result, request)
	if result.Code != 401 {
		t.Fatal("old session survived credential change")
	}
	result = httptest.NewRecorder()
	app.Auth.Login(result, testutil.Request("POST", "/api/login", `{"username":"owner","password":"new-long-admin-password"}`))
	if result.Code != 200 {
		t.Fatal("new credentials rejected", result.Body.String())
	}
}
