package server

import (
	"context"
	"errors"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/buildinfo"
	"hy2-panel/internal/buildinfo/updates"
	deviceapi "hy2-panel/internal/devices/integration"
	"hy2-panel/internal/firewall"
	"hy2-panel/internal/firewall/recommendations"
	groupapi "hy2-panel/internal/groups/integration"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	portweb "hy2-panel/internal/portcontrol/web"
	"hy2-panel/internal/security"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transport"
	useraccess "hy2-panel/internal/useraccess/integration"
	"hy2-panel/internal/users"
	"hy2-panel/internal/websettings"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func routes(auth *auth.Handler, users *users.Handler, registry *instances.Registry, subscriptions *subscriptions.Handler, traffic *traffic.Service, web *websettings.Handler, access *useraccess.Handler, devices *deviceapi.Handler, groups *groupapi.Handler) http.Handler {
	mux := http.NewServeMux()
	panelUpdates := updates.New(buildinfo.Version())
	mux.HandleFunc("GET /api/version", buildinfo.Read)
	mux.HandleFunc("POST /api/login", auth.Login)
	mux.HandleFunc("GET /api/deployment/udp/status/{ticket}", portweb.Status)
	protected := map[string]http.HandlerFunc{
		"GET /api/groups":                         groups.Read,
		"POST /api/groups":                        groups.Save,
		"PUT /api/groups/{group}":                 groups.Save,
		"DELETE /api/groups/{group}":              groups.Remove,
		"PUT /api/users/{id}/group":               groups.Assign,
		"GET /api/firewall/ports":                 recommendations.Handler(web, registry),
		"GET /api/firewall":                       firewall.Panel(),
		"POST /api/firewall":                      firewall.Panel(),
		"GET /api/users/{id}/devices":             devices.Read,
		"PUT /api/users/{id}/devices":             devices.SetLimit,
		"PATCH /api/users/{id}/devices/{device}":  devices.Edit,
		"DELETE /api/users/{id}/devices/{device}": devices.Remove,
		"GET /api/users/{id}/cores":               access.Read,
		"PUT /api/users/{id}/cores":               access.Save,
		"GET /api/panel/update":                   panelUpdates.Read,
		"GET /api/traffic":                        groups.ReadTraffic,
		"PUT /api/users/{id}/traffic": func(writer http.ResponseWriter, request *http.Request) {
			if _, err := users.User(request.PathValue("id")); err != nil {
				transport.Fail(writer, errors.New("Пользователь не найден"), 404)
				return
			}
			traffic.Adjust(writer, request)
		},
		"GET /api/admin/announcement": subscriptions.Announcements.Read,
		"PUT /api/admin/announcement": subscriptions.Announcements.Save,
		"POST /api/logout":            auth.Logout,
		"GET /api/session":            auth.Session,
		"GET /api/admin/web":          web.Read,
		"PUT /api/admin/web":          web.Save,
		"GET /api/admin/account":      auth.Account,
		"PUT /api/admin/account":      auth.ChangeAccount,
		"GET /api/users":              users.List, "POST /api/users": users.Create,
		"PATCH /api/users/{id}": users.Edit, "DELETE /api/users/{id}": users.Delete,
		"POST /api/users/{id}/rotate": users.Rotate, "GET /api/users/{id}/links": subscriptions.Links,
	}
	for pattern, handler := range protected {
		mux.HandleFunc(pattern, auth.Protect(handler))
	}
	instanceapi.Register(mux, registry, auth.Protect)
	mux.HandleFunc("GET /sub/{token}", subscriptions.Serve)
	mux.HandleFunc("/api/", func(writer http.ResponseWriter, request *http.Request) {
		transport.Fail(writer, errors.New("Маршрут не найден"), 404)
	})
	mux.Handle("/", http.FileServer(http.Dir(security.Env("PANEL_WEB", "web/dist"))))
	return transport.Headers(mux)
}
func awaitShutdown(failures <-chan error, servers []*http.Server) error {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(quit)
	var err error
	select {
	case <-quit:
	case err = <-failures:
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	for _, server := range servers {
		server.Shutdown(ctx)
	}
	return err
}
