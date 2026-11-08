package auth

import (
	"errors"
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
	epoch := handler.loginEpoch()
	now := time.Now()
	if !handler.attempts.Allow(ip, now) {
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
	if handler.Credentials.HasCloudPassword() {
		token, available := handler.challenges.Issue(ip, epoch, now)
		if !available {
			transport.Fail(writer, errors.New("Слишком много запросов входа. Повторите позже"), 429)
			return
		}
		transport.Respond(writer, map[string]any{"ok": false, "cloudPasswordRequired": true, "challenge": token})
		return
	}
	handler.issueSession(writer, epoch)
}

func (handler *Handler) CloudLogin(writer http.ResponseWriter, request *http.Request) {
	if request.Header.Get("X-Panel-Request") != "1" {
		transport.Fail(writer, errors.New("Запрос отклонён"), 403)
		return
	}
	var input struct {
		Challenge string `json:"challenge"`
		Password  string `json:"password"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	ip, _, _ := net.SplitHostPort(request.RemoteAddr)
	epoch, valid := handler.challenges.Begin(input.Challenge, ip, time.Now())
	if !valid {
		transport.Fail(writer, errors.New("Запрос входа истёк. Вернитесь к вводу логина и пароля"), 410)
		return
	}
	if !handler.Credentials.VerifyCloud(input.Password) {
		transport.Fail(writer, errors.New("Неверный облачный пароль"), 401)
		return
	}
	if !handler.challenges.Consume(input.Challenge, ip, time.Now()) {
		transport.Fail(writer, errors.New("Запрос входа уже использован или истёк"), 410)
		return
	}
	handler.issueSession(writer, epoch)
}
