package auth

import (
	"errors"
	"hy2-panel/internal/auth/attempts"
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
	"sync"
	"time"
)

type Handler struct {
	Credentials *credentials.Store
	Secure      bool
	mu          sync.Mutex
	sessions    map[string]time.Time
	attempts    *attempts.Limiter
}

func New(password []byte, secure bool) *Handler {
	store, _ := credentials.New("admin", password, "")
	return &Handler{Credentials: store, Secure: secure, sessions: map[string]time.Time{}, attempts: attempts.New()}
}

func (handler *Handler) Protect(next http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != "GET" && request.Method != "HEAD" {
			if request.Header.Get("X-Panel-Request") != "1" {
				transport.Fail(writer, errors.New("Запрос отклонён"), 403)
				return
			}
		}
		cookie, err := request.Cookie("hy2_session")
		if err != nil {
			transport.Fail(writer, errors.New("Нужен вход"), 401)
			return
		}
		handler.mu.Lock()
		expiry, ok := handler.sessions[security.Hash(cookie.Value)]
		if ok && time.Now().After(expiry) {
			delete(handler.sessions, security.Hash(cookie.Value))
			ok = false
		}
		handler.mu.Unlock()
		if !ok {
			transport.Fail(writer, errors.New("Сессия завершена"), 401)
			return
		}
		next(writer, request)
	}
}

func (handler *Handler) Logout(writer http.ResponseWriter, request *http.Request) {
	cookie, _ := request.Cookie("hy2_session")
	handler.mu.Lock()
	delete(handler.sessions, security.Hash(cookie.Value))
	handler.mu.Unlock()
	http.SetCookie(writer, &http.Cookie{Name: "hy2_session", Path: "/", HttpOnly: true, Secure: handler.Secure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	transport.Respond(writer, map[string]bool{"ok": true})
}
