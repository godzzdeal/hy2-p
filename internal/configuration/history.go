package configuration

import (
	"encoding/json"
	"hy2-panel/internal/transport"
	"net/http"
)

func (handler *Handler) History(writer http.ResponseWriter, request *http.Request) {
	if handler.Profile != nil {
		result, err := handler.Profile.History()
		if err != nil {
			transport.Fail(writer, err, 500)
			return
		}
		transport.Respond(writer, result)
		return
	}
	rows, err := handler.DB.Query("SELECT id,created,body FROM history ORDER BY id DESC")
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	defer rows.Close()
	result := []map[string]any{}
	for rows.Next() {
		var id int
		var created, raw string
		if err = rows.Scan(&id, &created, &raw); err != nil {
			transport.Fail(writer, err, 500)
			return
		}
		var settings Settings
		if err := json.Unmarshal([]byte(raw), &settings); err != nil {
			transport.Fail(writer, err, 500)
			return
		}
		if handler.Vault != nil {
			settings.Config, err = handler.Vault.OpenPassword(settings.Config)
			if err != nil {
				transport.Fail(writer, err, 500)
				return
			}
		}
		result = append(result, map[string]any{"id": id, "created": created, "settings": settings})
	}
	if err := rows.Err(); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, result)
}
