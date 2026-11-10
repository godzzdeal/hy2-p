package usercredentials_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/server/bootstrap"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

func userFixture(t *testing.T) (*users.Handler, *connector) {
	t.Helper()
	directory := t.TempDir()
	initial, err := bootstrap.OpenDatabase(directory, configuration.Settings{})
	if err != nil {
		t.Fatal(err)
	}
	source := &connector{driver: initial.Driver(), name: filepath.Join(directory, "panel.db")}
	if err := initial.Close(); err != nil {
		t.Fatal(err)
	}
	db := sql.OpenDB(source)
	db.SetMaxOpenConns(2)
	first, err := db.Conn(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	second, err := db.Conn(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if err := first.Close(); err != nil {
		t.Fatal(err)
	}
	if err := second.Close(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Error(err)
		}
	})
	vault, err := cryptovault.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	return &users.Handler{DB: db, Vault: vault, Kick: func(string) {}}, source
}
func writeUser(handler *users.Handler, id, name, password string) *httptest.ResponseRecorder {
	body, _ := json.Marshal(map[string]any{"name": name, "password": password, "enabled": true})
	response := httptest.NewRecorder()
	if id == "" {
		body, _ = json.Marshal(map[string]string{"name": name, "password": password})
		handler.Create(response, testutil.Request("POST", "/users", string(body)))
	} else {
		request := testutil.Request("PUT", "/users/"+id, string(body))
		request.SetPathValue("id", id)
		handler.Edit(response, request)
	}
	return response
}
func TestConcurrentCredentialsRemainUnique(t *testing.T) {
	for _, mode := range []string{"create", "edit"} {
		t.Run(mode, func(t *testing.T) {
			handler, source := userFixture(t)
			ids := []string{"", ""}
			if mode == "edit" {
				for _, name := range []string{"first", "second"} {
					if result := writeUser(handler, "", name, "initial-password-"+name); result.Code != 201 {
						t.Fatal(result.Body.String())
					}
				}
				entries, err := handler.All()
				if err != nil {
					t.Fatal(err)
				}
				ids[0], ids[1] = entries[0].ID, entries[1].ID
			}
			source.gate = &validationGate{done: make(chan struct{})}
			start := make(chan struct{})
			responses := make([]*httptest.ResponseRecorder, 2)
			var requests sync.WaitGroup
			for index := range responses {
				requests.Add(1)
				go func() {
					defer requests.Done()
					<-start
					responses[index] = writeUser(handler, ids[index], []string{"first", "second"}[index], "shared-password-123456")
				}()
			}
			close(start)
			requests.Wait()
			successes, conflicts := 0, 0
			for _, response := range responses {
				switch response.Code {
				case 200, 201:
					successes++
				case 400:
					if !strings.Contains(response.Body.String(), "такой пароль уже используется") {
						t.Fatal(response.Body.String())
					}
					conflicts++
				default:
					t.Fatalf("unexpected status %d: %s", response.Code, response.Body.String())
				}
			}
			if successes != 1 || conflicts != 1 {
				t.Fatalf("successes=%d conflicts=%d", successes, conflicts)
			}
			if _, err := handler.ByPassword("shared-password-123456"); err != nil {
				t.Fatal(err)
			}
		})
	}
}
