package users

import (
	"errors"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
)

func (handler *Handler) Edit(writer http.ResponseWriter, request *http.Request) {
	var payload struct {
		Name     string `json:"name"`
		Password string `json:"password"`
		Enabled  bool   `json:"enabled"`
		Expires  string `json:"expires"`
	}
	if err := transport.Decode(writer, request, &payload); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	user, err := handler.User(request.PathValue("id"))
	if err != nil {
		transport.Fail(writer, errors.New("Пользователь не найден"), 404)
		return
	}
	if payload.Password != "" {
		user.Password = payload.Password
	}
	user.Name = payload.Name
	user.Enabled = payload.Enabled
	user.Expires = payload.Expires
	if err = validUser(user); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	encrypted, err := handler.Vault.Seal(user.Password)
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	tx, err := handler.DB.Begin()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	defer tx.Rollback()
	if payload.Password != "" {
		if err := handler.validatePassword(tx, user.Password, user.ID); err != nil {
			transport.Fail(writer, err, 400)
			return
		}
	}
	_, err = tx.Exec("UPDATE users SET name=?,enabled=?,expires=?,password=? WHERE id=?", user.Name, user.Enabled, user.Expires, encrypted, user.ID)
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	if !Active(user) || payload.Password != "" {
		handler.Kick(user.ID)
	}
	if handler.DisplayName != nil {
		user.DisplayName = handler.DisplayName(user.Name)
	}
	transport.Respond(writer, user)
}
func (handler *Handler) Delete(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	if _, err := handler.DB.Exec("DELETE FROM users WHERE id=?", id); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	handler.Kick(id)
	transport.Respond(writer, map[string]bool{"ok": true})
}

func (handler *Handler) Rotate(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	if _, err := handler.User(id); err != nil {
		transport.Fail(writer, errors.New("Пользователь не найден"), 404)
		return
	}
	if _, err := handler.DB.Exec("UPDATE users SET token=? WHERE id=?", security.Token(), id); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, map[string]bool{"ok": true})
}
