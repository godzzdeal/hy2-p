package subscriptions

import (
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/transport"
	"hy2-panel/internal/users"
	"io"
	"net/http"
	"strings"
	"time"
)

type Handler struct {
	DB            *sql.DB
	Users         *users.Handler
	Config        *configuration.Handler
	Announcements *announcement.Store
	PublicURL     string
	Sources       func() ([]Profile, error)
}

func (handler *Handler) Links(writer http.ResponseWriter, request *http.Request) {
	user, err := handler.Users.User(request.PathValue("id"))
	if err != nil {
		transport.Fail(writer, errors.New("Пользователь не найден"), 404)
		return
	}
	connections, err := handler.connections(user)
	if err != nil {
		transport.Fail(writer, err, 422)
		return
	}
	transport.Respond(writer, map[string]any{"uri": connections[0].URI, "connections": connections, "subscription": handler.PublicURL + "/sub/" + user.Token})
}

func (handler *Handler) Serve(writer http.ResponseWriter, request *http.Request) {
	user, err := users.Scan(handler.DB.QueryRow("SELECT id,name,enabled,expires,created,password,token FROM users WHERE token=?", request.PathValue("token")))
	if err != nil || !users.Active(user) {
		http.NotFound(writer, request)
		return
	}
	user.Password, err = handler.Users.Vault.OpenPassword(user.Password)
	if err != nil {
		http.Error(writer, "Unavailable", 503)
		return
	}
	connections, err := handler.connections(user)
	if err != nil {
		http.Error(writer, "Server configuration does not support URI export", 503)
		return
	}
	lines := make([]string, 0, len(connections))
	for _, connection := range connections {
		lines = append(lines, connection.URI)
	}
	content := strings.Join(lines, "\n") + "\n"
	writer.Header().Set("Content-Type", "text/plain; charset=utf-8")
	writer.Header().Set("profile-update-interval", "6")
	if handler.Announcements != nil {
		handler.Announcements.Headers(writer.Header())
	}
	if user.Expires != "" {
		timestamp, _ := time.Parse(time.RFC3339, user.Expires)
		writer.Header().Set("subscription-userinfo", fmt.Sprintf("expire=%d", timestamp.Unix()))
	}
	if request.URL.Query().Get("format") == "uri" {
		io.WriteString(writer, content)
	} else {
		io.WriteString(writer, base64.StdEncoding.EncodeToString([]byte(content)))
	}
}
