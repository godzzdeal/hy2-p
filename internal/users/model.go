package users

import (
	"crypto/subtle"
	"errors"
	"hy2-panel/internal/transport"
	"net/http"
	"strings"
	"time"
)

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Enabled  bool   `json:"enabled"`
	Expires  string `json:"expires"`
	Created  string `json:"created"`
	Password string `json:"-"`
	Token    string `json:"-"`
}

func validUser(user User) error {
	if len(strings.TrimSpace(user.Name)) == 0 || len(user.Name) > 100 {
		return errors.New("Имя должно содержать от 1 до 100 символов")
	}
	if user.Expires != "" {
		if _, err := time.Parse(time.RFC3339, user.Expires); err != nil {
			return errors.New("Неверная дата окончания")
		}
	}
	return nil
}

func Active(user User) bool {
	if !user.Enabled {
		return false
	}
	if user.Expires == "" {
		return true
	}
	timestamp, err := time.Parse(time.RFC3339, user.Expires)
	return err == nil && time.Now().Before(timestamp)
}

func Scan(row interface{ Scan(...any) error }) (User, error) {
	var user User
	err := row.Scan(&user.ID, &user.Name, &user.Enabled, &user.Expires, &user.Created, &user.Password, &user.Token)
	return user, err
}
func (handler *Handler) Authenticate(writer http.ResponseWriter, request *http.Request) {
	handler.authenticate(writer, request, "default")
}
func (handler *Handler) AuthenticateFor(instance string) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		handler.authenticate(writer, request, instance)
	}
}
func (handler *Handler) authenticate(writer http.ResponseWriter, request *http.Request, instance string) {
	var payload struct {
		Auth string `json:"auth"`
		Addr string `json:"addr"`
		TX   uint64 `json:"tx"`
	}
	if err := transport.Decode(writer, request, &payload); err != nil {
		transport.Respond(writer, map[string]any{"ok": false, "id": ""})
		return
	}
	// The callback is bound to loopback and never exposed by the public router.
	resolve := handler.ResolveCredential
	if resolve == nil {
		resolve = func(password string) (User, string, error) {
			user, err := handler.ByPassword(password)
			return user, user.ID, err
		}
	}
	user, identity, err := resolve(payload.Auth)
	ok := err == nil && Active(user) && (handler.Allow == nil || handler.Allow(user.ID))
	ok = ok && (handler.AllowCore == nil || handler.AllowCore(user.ID, instance))
	if ok && handler.OnAuthenticated != nil {
		handler.OnAuthenticated(user.ID, payload.Auth, instance, payload.Addr)
	}
	transport.Respond(writer, map[string]any{"ok": ok, "id": identity})
}
func (handler *Handler) ByPassword(password string) (User, error) {
	user, err := Scan(handler.DB.QueryRow("SELECT id,name,enabled,expires,created,password,token FROM users WHERE password LIKE ? OR password=?", handler.Vault.Prefix(password)+"%", password))
	if err == nil {
		user.Password, err = handler.Vault.OpenPassword(user.Password)
	}
	if err != nil || subtle.ConstantTimeCompare([]byte(user.Password), []byte(password)) != 1 {
		return User{}, errors.New("Неверные данные доступа")
	}
	return user, nil
}
