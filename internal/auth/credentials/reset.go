package credentials

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/records"
	"os"
	"strings"
)

const MinAdminPassword = 16
const MaxPasswordBytes = 72

// ResetAdmin is an offline recovery operation. The manager stops the panel first,
// so no process can keep accepting the old password or an existing session.
func ResetAdmin(directory, fallbackUsername, password string) (string, bool, error) {
	if len(password) < MinAdminPassword || len(password) > MaxPasswordBytes || strings.ContainsAny(password, "\r\n") {
		return "", false, errors.New("пароль: от 16 до 72 байт, без перевода строки")
	}
	var value Value
	if err := records.Read(directory, "credentials", &value); err != nil {
		if !os.IsNotExist(err) {
			return "", false, err
		}
		value.Username = fallbackUsername
	}
	if value.Username == "" {
		return "", false, errors.New("пустой логин администратора")
	}
	if len(value.CloudHash) > 0 {
		if _, err := bcrypt.Cost(value.CloudHash); err != nil {
			return "", false, errors.New("Повреждён облачный пароль. Сначала выполните cloud-password-reset")
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", false, err
	}
	value.Hash = hash
	if err := records.Write(directory, "credentials", value); err != nil {
		return "", false, err
	}
	return value.Username, len(value.CloudHash) > 0, nil
}
