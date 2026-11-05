package server

import (
	"errors"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/certificates"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core"
	"hy2-panel/internal/security"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transport"
	"hy2-panel/internal/users"
	"hy2-panel/internal/websettings"
	"net/http"
)

func routes(auth *auth.Handler, users *users.Handler, config *configuration.Handler, core *core.Handler, subscriptions *subscriptions.Handler, traffic *traffic.Service, web *websettings.Handler, certificates *certificates.Handler) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", auth.Login)
	protected := map[string]http.HandlerFunc{
		"GET /api/traffic": traffic.Read,
		"PUT /api/users/{id}/traffic": func(writer http.ResponseWriter, request *http.Request) {
			if _, err := users.User(request.PathValue("id")); err != nil {
				transport.Fail(writer, errors.New("Пользователь не найден"), 404)
				return
			}
			traffic.Adjust(writer, request)
		},
		"GET /api/admin/announcement":     subscriptions.Announcements.Read,
		"PUT /api/admin/announcement":     subscriptions.Announcements.Save,
		"POST /api/logout":                auth.Logout,
		"GET /api/session":                auth.Session,
		"GET /api/admin/web":              web.Read,
		"PUT /api/admin/web":              web.Save,
		"POST /api/certificates/hysteria": certificates.Upload,
		"GET /api/certificates/hysteria":  certificates.Inspect,
		"GET /api/admin/account":          auth.Account,
		"PUT /api/admin/account":          auth.ChangeAccount,
		"GET /api/users":                  users.List, "POST /api/users": users.Create,
		"PATCH /api/users/{id}": users.Edit, "DELETE /api/users/{id}": users.Delete,
		"POST /api/users/{id}/rotate": users.Rotate, "GET /api/users/{id}/links": subscriptions.Links,
		"GET /api/settings": func(writer http.ResponseWriter, request *http.Request) {
			settings, err := config.Get()
			if err != nil {
				transport.Fail(writer, err, 500)
				return
			}
			transport.Respond(writer, settings)
		},
		"PUT /api/settings": config.Save, "GET /api/history": config.History,
		"GET /api/core/versions":  core.Versions,
		"GET /api/core/update":    core.UpdateStatus,
		"POST /api/core/update":   core.Update,
		"POST /api/core/rollback": core.Rollback,
		"GET /api/core":           core.Status, "POST /api/core/{action}": core.Control, "GET /api/logs": core.Logs,
	}
	for pattern, handler := range protected {
		mux.HandleFunc(pattern, auth.Protect(handler))
	}
	mux.HandleFunc("GET /sub/{token}", subscriptions.Serve)
	mux.HandleFunc("/api/", func(writer http.ResponseWriter, request *http.Request) {
		transport.Fail(writer, errors.New("Маршрут не найден"), 404)
	})
	mux.Handle("/", http.FileServer(http.Dir(security.Env("PANEL_WEB", "web/dist"))))
	return transport.Headers(mux)
}
