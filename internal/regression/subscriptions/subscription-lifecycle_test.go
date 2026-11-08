package subscriptions_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSubscriptionLifecycle(t *testing.T) {
	a := testutil.New(t)
	w := httptest.NewRecorder()
	a.Users.Create(w, testutil.Request("POST", "/api/users", `{"name":"My phone","expires":""}`))
	if w.Code != 201 {
		t.Fatal(w.Body.String())
	}
	var u users.User
	json.Unmarshal(w.Body.Bytes(), &u)
	u, e := a.Users.User(u.ID)
	if e != nil {
		t.Fatal(e)
	}
	// Administrative list responses must never contain access credentials.
	if strings.Contains(w.Body.String(), u.Password) || strings.Contains(w.Body.String(), u.Token) {
		t.Fatal("credential leak in user response")
	}
	get := func(tok string) *httptest.ResponseRecorder {
		r := testutil.Request("GET", "/sub/"+tok, "")
		r.SetPathValue("token", tok)
		w := httptest.NewRecorder()
		a.Subscriptions.Serve(w, r)
		return w
	}
	sub := get(u.Token)
	if sub.Code != 200 {
		t.Fatal(sub.Body.String())
	}
	decoded, e := base64.StdEncoding.DecodeString(sub.Body.String())
	if e != nil || !strings.HasPrefix(string(decoded), "hy2://") {
		t.Fatal("invalid subscription")
	}
	auth := httptest.NewRecorder()
	a.Users.Authenticate(auth, testutil.Request("POST", "/auth", `{"auth":"`+u.Password+`","addr":"1.2.3.4:1234","tx":100}`))
	if !strings.Contains(auth.Body.String(), `"ok":true`) {
		t.Fatal("auth rejected")
	}
	r := testutil.Request("POST", "/rotate", "")
	r.SetPathValue("id", u.ID)
	a.Users.Rotate(httptest.NewRecorder(), r)
	if get(u.Token).Code != 404 {
		t.Fatal("old token still works")
	}
	u, _ = a.Users.User(u.ID)
	if get(u.Token).Code != 200 {
		t.Fatal("new token failed")
	}
	a.DB.Exec("UPDATE users SET expires=? WHERE id=?", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339), u.ID)
	if get(u.Token).Code != 404 {
		t.Fatal("expired subscription accepted")
	}
	auth = httptest.NewRecorder()
	a.Users.Authenticate(auth, testutil.Request("POST", "/auth", `{"auth":"`+u.Password+`"}`))
	if !strings.Contains(auth.Body.String(), `"ok":false`) {
		t.Fatal("expired user authenticated")
	}
}
