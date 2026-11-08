package users

import (
	"database/sql"
	"errors"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
	"strings"
	"time"
)

type Handler struct {
	Vault             *cryptovault.Vault
	DB                *sql.DB
	Kick              func(string)
	Allow             func(string) bool
	AllowCore         func(string, string) bool
	ResolveCredential func(string) (User, string, error)
	OnAuthenticated   func(string, string, string, string)
}

func (handler *Handler) User(id string) (User, error) {
	user, err := Scan(handler.DB.QueryRow("SELECT id,name,enabled,expires,created,password,token FROM users WHERE id=?", id))
	if err == nil {
		user.Password, err = handler.Vault.OpenPassword(user.Password)
	}
	return user, err
}

func (handler *Handler) List(writer http.ResponseWriter, request *http.Request) {
	users, err := handler.All()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, users)
}
func (handler *Handler) All() ([]User, error) {
	rows, err := handler.DB.Query("SELECT id,name,enabled,expires,created,password,token FROM users ORDER BY created DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := []User{}
	for rows.Next() {
		user, err := Scan(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}
func (handler *Handler) Create(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Name     string `json:"name"`
		Password string `json:"password"`
		Expires  string `json:"expires"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	user := User{ID: security.Token()[:16], Name: strings.TrimSpace(input.Name), Expires: input.Expires, Enabled: true, Created: time.Now().UTC().Format(time.RFC3339), Password: security.Token(), Token: security.Token()}
	if input.Password != "" {
		if err := handler.validatePassword(input.Password, ""); err != nil {
			transport.Fail(writer, err, 400)
			return
		}
		user.Password = input.Password
	}
	if err := validUser(user); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	encrypted, err := handler.Vault.Seal(user.Password)
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	_, err = handler.DB.Exec("INSERT INTO users VALUES(?,?,?,?,?,?,?)", user.ID, user.Name, user.Enabled, user.Expires, user.Created, encrypted, user.Token)
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	writer.WriteHeader(201)
	transport.Respond(writer, user)
}

func (handler *Handler) validatePassword(password, id string) error {
	if len(password) < 12 || len(password) > 128 {
		return errors.New("пароль пользователя: от 12 до 128 байт")
	}
	var count int
	if err := handler.DB.QueryRow("SELECT count(*) FROM users WHERE id<>? AND (password LIKE ? OR password=?)", id, handler.Vault.Prefix(password)+"%", password).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return errors.New("такой пароль уже используется другим пользователем")
	}
	return nil
}
