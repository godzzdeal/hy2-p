package importing

import (
	"errors"
	"hy2-panel/internal/users"
	"strings"
)

// Import publishes a new account only after its policies have been saved.
// The transaction prevents a concurrent creation from reusing its credentials.
func Account(handler *users.Handler, user users.User, prepare func() error) error {

	if len(user.Password) < 12 || len(user.Password) > 128 {
		return errors.New("Некорректный пароль пользователя")
	}
	encrypted, err := handler.Vault.Seal(user.Password)
	if err != nil {
		return err
	}
	tx, err := handler.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var count int
	err = tx.QueryRow("SELECT count(*) FROM users WHERE id=? OR token=? OR lower(name)=? OR password LIKE ? OR password=?",
		user.ID, user.Token, strings.ToLower(user.Name), handler.Vault.Prefix(user.Password)+"%", user.Password).Scan(&count)
	if err != nil {
		return err
	}
	if count != 0 {
		return errors.New("Пользователь уже существует; запись пропущена")
	}
	// All preparation operates on separate stores and never queries the database.
	if err := prepare(); err != nil {
		return err
	}
	if _, err := tx.Exec("INSERT INTO users VALUES(?,?,?,?,?,?,?)", user.ID, user.Name, user.Enabled, user.Expires, user.Created, encrypted, user.Token); err != nil {
		return err
	}
	return tx.Commit()
}
