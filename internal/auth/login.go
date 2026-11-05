package auth

import (
	"errors"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net"
	"net/http"
	"time"
)

func (handler *Handler) Login(writer http.ResponseWriter, request *http.Request) {
	if request.Header.Get("X-Panel-Request") != "1" {
		transport.Fail(writer, errors.New("Запрос отклонён"), 403)
		return
	}
	ip, _, _ := net.SplitHostPort(request.RemoteAddr)
	handler.mu.Lock()
	now := time.Now()
	recent := []time.Time{}
	for _, sessionToken := range handler.attempts[ip] {
		if now.Sub(sessionToken) < time.Minute {
			recent = append(recent, sessionToken)
		}
	}
	blocked := len(recent) >= 5
	recent = append(recent, now)
	handler.attempts[ip] = recent
	if len(handler.attempts) > 10000 {
		for key, value := range handler.attempts {
			if len(value) == 0 || now.Sub(value[len(value)-1]) > time.Minute {
				delete(handler.attempts, key)
			}
		}
	}
	handler.mu.Unlock()
	if blocked {
		transport.Fail(writer, errors.New("Слишком много попыток. Подождите минуту"), 429)
		return
	}
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := transport.Decode(writer, request, &payload); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if !handler.Credentials.Verify(payload.Username, payload.Password) {
		transport.Fail(writer, errors.New("Неверный логин или пароль"), 401)
		return
	}
	sessionToken := security.Token()
	handler.mu.Lock()
	for key, value := range handler.sessions {
		if now.After(value) {
			delete(handler.sessions, key)
		}
	}
	handler.sessions[security.Hash(sessionToken)] = now.Add(12 * time.Hour)
	handler.mu.Unlock()
	http.SetCookie(writer, &http.Cookie{Name: "hy2_session", Value: sessionToken, Path: "/", HttpOnly: true, Secure: handler.Secure, SameSite: http.SameSiteStrictMode, MaxAge: 43200})
	transport.Respond(writer, map[string]bool{"ok": true})
}
