package auth

import (
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/transport"
	"net/http"
	"path/filepath"
	"time"
)

func Open(password []byte, secure bool, data, username string) (*Handler, error) {
	handler := New(password, secure)
	store, err := credentials.New(username, password, filepath.Join(data, "admin"))
	if err != nil {
		return nil, err
	}
	handler.Credentials = store
	return handler, nil
}
func (handler *Handler) Session(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, map[string]any{"ok": true, "username": handler.Credentials.Username()})
}
func (handler *Handler) Account(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, map[string]string{"username": handler.Credentials.Username()})
}
func (handler *Handler) ChangeAccount(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		CurrentPassword string `json:"currentPassword"`
		Username        string `json:"username"`
		Password        string `json:"password"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if err := handler.Credentials.Change(input.CurrentPassword, input.Username, input.Password); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	handler.mu.Lock()
	handler.sessions = map[string]time.Time{}
	handler.mu.Unlock()
	http.SetCookie(writer, &http.Cookie{Name: "hy2_session", Path: "/", HttpOnly: true, Secure: handler.Secure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	transport.Respond(writer, map[string]any{"username": handler.Credentials.Username(), "loginRequired": true})
}
