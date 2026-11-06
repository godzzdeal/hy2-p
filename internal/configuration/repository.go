package configuration

import (
	"database/sql"
	"encoding/json"
	"errors"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"time"
)

type Handler struct {
	DB    *sql.DB
	Vault *cryptovault.Vault
}

func (handler *Handler) Get() (Settings, error) {
	var raw string
	var settings Settings
	if err := handler.DB.QueryRow("SELECT body FROM settings WHERE id=1").Scan(&raw); err != nil {
		return settings, err
	}
	if err := json.Unmarshal([]byte(raw), &settings); err != nil {
		return settings, err
	}
	if handler.Vault != nil {
		plain, err := handler.Vault.OpenPassword(settings.Config)
		if err != nil {
			return settings, err
		}
		settings.Config = plain
	}
	return settings, nil
}
func (handler *Handler) Save(writer http.ResponseWriter, request *http.Request) {
	if protocol.Busy(request.Context()) {
		transport.Fail(writer, errors.New("Применение UDP-порта ещё выполняется"), 409)
		return
	}
	var settings Settings
	if err := transport.Decode(writer, request, &settings); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if err := Validate(settings); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	tx, err := handler.DB.Begin()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	defer tx.Rollback()
	_, err = tx.Exec("INSERT INTO history(created,body) SELECT ?,body FROM settings WHERE id=1", time.Now().UTC().Format(time.RFC3339))
	if err == nil {
		stored := settings
		if handler.Vault != nil {
			stored.Config, err = handler.Vault.Seal(settings.Config)
			if err != nil {
				transport.Fail(writer, err, 500)
				return
			}
		}
		raw, _ := json.Marshal(stored)
		_, err = tx.Exec("UPDATE settings SET body=? WHERE id=1", string(raw))
	}
	if err == nil {
		_, err = tx.Exec("DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 20)")
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, settings)
}
