package integration

import (
	"errors"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/devices"
	"hy2-panel/internal/security"
	"hy2-panel/internal/users"
)

type Handler struct {
	Store *devices.Store
	Users *users.Handler
	Vault *cryptovault.Vault
	Kick  func(string)
}

func Open(data string, users *users.Handler, kick func(string)) (*Handler, error) {
	store, err := devices.Open(data, users.Vault)
	if err != nil {
		return nil, err
	}
	handler := &Handler{Store: store, Users: users, Vault: users.Vault, Kick: kick}
	users.ResolveCredential = handler.resolve
	users.OnAuthenticated = store.Connected
	return handler, nil
}
func (handler *Handler) resolve(password string) (users.User, string, error) {
	if reference, ok := handler.Store.Resolve(password); ok {
		user, err := handler.Users.User(reference.User)
		if err != nil || handler.Vault.Prefix(user.Password) != reference.Parent {
			return users.User{}, "", errors.New("Ключ устройства отозван")
		}
		return user, security.DeviceIdentity(user.ID, reference.Device, reference.Version), nil
	}
	user, err := handler.Users.ByPassword(password)
	if err != nil {
		return user, "", err
	}
	if handler.Store.Limit(user.ID) > 0 {
		return users.User{}, "", errors.New("Требуется ключ устройства из подписки")
	}
	return user, user.ID, nil
}
func (handler *Handler) AllowedIdentity(value string) bool {
	parent := security.ParentUser(value)
	user, err := handler.Users.User(parent)
	if err != nil || !users.Active(user) {
		return false
	}
	if value == parent {
		return handler.Store.Limit(parent) == 0
	}
	reference, ok := handler.Store.Identity(value)
	return ok && reference.Parent == handler.Vault.Prefix(user.Password)
}
