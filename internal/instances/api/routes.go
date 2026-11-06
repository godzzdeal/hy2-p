package api

import (
	"errors"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/transport"
	"net/http"
	"strings"
)

func Register(mux *http.ServeMux, registry *instances.Registry, protect func(http.HandlerFunc) http.HandlerFunc) {
	handler := Handler{Registry: registry}
	mux.HandleFunc("GET /api/instances", protect(handler.List))
	mux.HandleFunc("POST /api/instances", protect(handler.Create))
	mux.HandleFunc("PATCH /api/instances/{instance}", protect(handler.Rename))
	mux.HandleFunc("DELETE /api/instances/{instance}", protect(handler.Remove))
	endpoints := map[string]func(*instances.Instance) http.HandlerFunc{
		"GET /settings":               readSettings,
		"GET /history":                func(instance *instances.Instance) http.HandlerFunc { return instance.Config.History },
		"GET /core":                   func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Status },
		"POST /core/{action}":         func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Control },
		"GET /logs":                   func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Logs },
		"DELETE /logs":                func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Logs },
		"GET /core/versions":          func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Versions },
		"GET /core/update":            func(instance *instances.Instance) http.HandlerFunc { return instance.Core.UpdateStatus },
		"POST /core/update":           func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Update },
		"POST /core/rollback":         func(instance *instances.Instance) http.HandlerFunc { return instance.Core.Rollback },
		"GET /certificates/hysteria":  func(instance *instances.Instance) http.HandlerFunc { return instance.Certificates.Inspect },
		"POST /certificates/hysteria": func(instance *instances.Instance) http.HandlerFunc { return instance.Certificates.Upload },
		"POST /deployment/udp":        func(instance *instances.Instance) http.HandlerFunc { return instance.Ports.Apply },
	}
	for pattern, selectHandler := range endpoints {
		method, path, _ := strings.Cut(pattern, " ")
		wrapped := protect(func(w http.ResponseWriter, r *http.Request) {
			if method == "POST" && path == "/deployment/udp" && !handler.networkReady(w, r) {
				return
			}
			registry.WithCore(r.PathValue("instance"), w, r, selectHandler)
		})
		mux.HandleFunc(method+" /api"+path, wrapped)
		mux.HandleFunc(method+" /api/instances/{instance}"+path, wrapped)
	}
	// Save takes the registry write lock itself; never wrap it in a read lock.
	save := protect(func(w http.ResponseWriter, r *http.Request) {
		instance, err := registry.Get(r.PathValue("instance"))
		if err != nil {
			transport.Fail(w, err, 404)
			return
		}
		instance.Config.Save(w, r)
	})
	mux.HandleFunc("PUT /api/settings", save)
	mux.HandleFunc("PUT /api/instances/{instance}/settings", save)
	mux.HandleFunc("GET /api/deployment", protect(handler.Deployment))
	mux.HandleFunc("GET /api/instances/{instance}/deployment", protect(handler.Deployment))
}
func readSettings(instance *instances.Instance) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		settings, err := instance.Config.Get()
		if err != nil {
			transport.Fail(w, err, 500)
			return
		}
		transport.Respond(w, settings)
	}
}
func (handler Handler) Deployment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("instance")
	if id == "" {
		id = r.URL.Query().Get("instance")
	}
	if id == "" {
		id = instances.DefaultID
	}
	for _, definition := range handler.Registry.Definitions() {
		if definition.ID != id {
			continue
		}
		instance, err := handler.Registry.Get(id)
		if err == nil {
			deployment.ReadFor(instance.Config, id, definition.Removing, instance.Core.Running, handler.needsHTTP)(w, r)
			return
		}
	}
	transport.Fail(w, errors.New("Ядро не найдено"), 404)
}
