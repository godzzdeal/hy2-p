package integration

import (
	"errors"
	"hy2-panel/internal/transport"
	"net/http"
)

func (handler *Handler) exists(w http.ResponseWriter, r *http.Request) bool {
	if _, err := handler.Users.User(r.PathValue("id")); err != nil {
		transport.Fail(w, errors.New("Пользователь не найден"), 404)
		return false
	}
	return true
}
func (handler *Handler) Read(w http.ResponseWriter, r *http.Request) {
	if !handler.exists(w, r) {
		return
	}
	transport.Respond(w, handler.Store.Snapshot(r.PathValue("id")))
}
func (handler *Handler) Remove(w http.ResponseWriter, r *http.Request) {
	if !handler.exists(w, r) {
		return
	}
	id := r.PathValue("id")
	if err := handler.Store.Remove(id, r.PathValue("device")); err != nil {
		transport.Fail(w, err, 409)
		return
	}
	handler.Kick(id + "." + r.PathValue("device"))
	transport.Respond(w, handler.Store.Snapshot(id))
}
func (handler *Handler) SetLimit(w http.ResponseWriter, r *http.Request) {
	if !handler.exists(w, r) {
		return
	}
	var input struct {
		Limit *int `json:"limit"`
	}
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if input.Limit == nil {
		transport.Fail(w, errors.New("Укажите лимит устройств"), 400)
		return
	}
	id := r.PathValue("id")
	previous := handler.Store.Limit(id)
	if err := handler.Store.SetLimit(id, *input.Limit); err != nil {
		transport.Fail(w, err, 409)
		return
	}
	if previous != *input.Limit {
		handler.Kick(id)
	}
	transport.Respond(w, handler.Store.Snapshot(id))
}
func (handler *Handler) Edit(w http.ResponseWriter, r *http.Request) {
	if !handler.exists(w, r) {
		return
	}
	var input struct {
		Blocked *bool `json:"blocked"`
	}
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if input.Blocked == nil {
		transport.Fail(w, errors.New("Укажите состояние доступа устройства"), 400)
		return
	}
	id := r.PathValue("id")
	if err := handler.Store.SetBlocked(id, r.PathValue("device"), *input.Blocked); err != nil {
		transport.Fail(w, err, 409)
		return
	}
	if *input.Blocked {
		handler.Kick(id + "." + r.PathValue("device"))
	}
	transport.Respond(w, handler.Store.Snapshot(id))
}
