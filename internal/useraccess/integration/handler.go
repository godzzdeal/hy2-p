package integration

import (
	"errors"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/transport"
	"hy2-panel/internal/useraccess"
	"hy2-panel/internal/users"
	"net/http"
)

type Handler struct {
	Store         *useraccess.Store
	Registry      *instances.Registry
	Users         *users.Handler
	AllowIdentity func(string) bool
	Sources       func([]string)
	Observe       func(string, map[string]int, bool)
	GroupAllows   func(string, string) bool
}

func (handler *Handler) Allows(user, instance string) bool {
	return handler.Store.Allows(user, instance) && (handler.GroupAllows == nil || handler.GroupAllows(user, instance))
}

func Open(data string, registry *instances.Registry, users *users.Handler) (*Handler, error) {
	store, err := useraccess.Open(data)
	if err != nil {
		return nil, err
	}
	users.AllowCore = store.Allows
	return &Handler{Store: store, Registry: registry, Users: users}, nil
}
func (handler *Handler) Read(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, err := handler.Users.User(id); err != nil {
		transport.Fail(w, errors.New("Пользователь не найден"), 404)
		return
	}
	transport.Respond(w, handler.Store.Get(id))
}
func (handler *Handler) Save(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, err := handler.Users.User(id); err != nil {
		transport.Fail(w, errors.New("Пользователь не найден"), 404)
		return
	}
	var policy useraccess.Policy
	if err := transport.Decode(w, r, &policy); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if err := handler.validate(policy); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if err := handler.Store.Put(id, policy); err != nil {
		transport.Fail(w, err, 500)
		return
	}
	handler.revoke(id, policy)
	transport.Respond(w, handler.Store.Get(id))
}
