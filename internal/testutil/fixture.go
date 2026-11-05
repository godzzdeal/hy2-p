package testutil

import (
	"database/sql"
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/users"
	_ "modernc.org/sqlite"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

type Application struct {
	DB            *sql.DB
	Auth          *auth.Handler
	Users         *users.Handler
	Config        *configuration.Handler
	Subscriptions *subscriptions.Handler
}

func New(t *testing.T) *Application {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	db.SetMaxOpenConns(1)
	_, err = db.Exec(schema)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	password, _ := bcrypt.GenerateFromPassword([]byte("a-long-test-password"), bcrypt.MinCost)
	vault, err := cryptovault.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	configurationHandler := &configuration.Handler{DB: db, Vault: vault}
	userHandler := &users.Handler{DB: db, Kick: func(string) {}, Vault: vault}
	settings := configuration.Settings{Host: "vpn.example.com", Port: "8443", SNI: "tls.example.com", Config: "listen: :8443\ntls:\n  cert: /certs/test.crt\n  key: /certs/test.key\n"}
	raw, _ := json.Marshal(settings)
	if _, err = db.Exec("INSERT INTO settings VALUES(1,?)", string(raw)); err != nil {
		t.Fatal(err)
	}
	return &Application{DB: db, Auth: auth.New(password, false), Users: userHandler, Config: configurationHandler, Subscriptions: &subscriptions.Handler{DB: db, Users: userHandler, Config: configurationHandler, PublicURL: "https://panel.example.com"}}
}
func Request(method, path, body string) *http.Request {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("X-Panel-Request", "1")
	return request
}

const schema = `CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT,enabled INTEGER,expires TEXT,created TEXT,password TEXT,token TEXT UNIQUE);
CREATE TABLE settings(id INTEGER PRIMARY KEY,body TEXT);
CREATE TABLE history(id INTEGER PRIMARY KEY,created TEXT,body TEXT);`
