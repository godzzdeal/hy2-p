package api

import (
	"errors"
	"hy2-panel/internal/aclfiles"
	"hy2-panel/internal/certificates/management"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/core/tools"
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
		"POST /tools/acl-file":        func(instance *instances.Instance) http.HandlerFunc { return aclfiles.Handler(instance.Core.Data) },
		"GET /tools/mimic":            func(instance *instances.Instance) http.HandlerFunc { return coreTools(instance).Mimic },
		"POST /tools/mimic":           func(instance *instances.Instance) http.HandlerFunc { return coreTools(instance).Mimic },
		"GET /tools/ech":              func(instance *instances.Instance) http.HandlerFunc { return coreTools(instance).Read },
		"POST /tools/ech":             func(instance *instances.Instance) http.HandlerFunc { return coreTools(instance).Create },
		"GET /tools/traffic-stats":    func(instance *instances.Instance) http.HandlerFunc { return coreTools(instance).Stats },
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
	for _, method := range []string{"GET", "DELETE"} {
		mux.HandleFunc(method+" /api/certificates/hysteria", protect(handler.Certificates))
		mux.HandleFunc(method+" /api/instances/{instance}/certificates/hysteria", protect(handler.Certificates))
	}
	mux.HandleFunc("GET /api/deployment", protect(handler.Deployment))
	mux.HandleFunc("GET /api/instances/{instance}/deployment", protect(handler.Deployment))
}

func (handler Handler) Certificates(writer http.ResponseWriter, request *http.Request) {
	err := handler.Registry.WithInstances(func(items []*instances.Instance) error {
		id := request.PathValue("instance")
		if id == "" {
			id = instances.DefaultID
		}
		var selected *instances.Instance
		references := []management.Reference{}
		for _, instance := range items {
			if instance.ID == id && !instance.Removing {
				selected = instance
			}
			settings, err := instance.Config.Get()
			if err != nil {
				return err
			}
			running := instance.Core.Running()
			references = append(references, management.Reference{Source: settings.Config, Data: instance.Core.Data, Running: running || instance.Core.Watchdog.Snapshot().DesiredRunning})
			if running {
				source, err := management.Runtime(instance.Core.Data)
				if err != nil {
					return err
				}
				references = append(references, management.Reference{Source: source, Data: instance.Core.Data, Running: true})
			}
		}
		if selected == nil {
			return errors.New("Экземпляр недоступен или ожидает удаления")
		}
		certificates := *selected.Certificates
		certificates.References = references
		if request.Method == http.MethodDelete {
			certificates.Delete(writer, request)
		} else {
			certificates.Inspect(writer, request)
		}
		return nil
	})
	if err != nil {
		transport.Fail(writer, err, 409)
	}
}
func coreTools(instance *instances.Instance) tools.Handler {
	return tools.Handler{Config: instance.Config, Binary: instance.Core.BinaryPath, Data: instance.Core.Data, Address: instance.Core.StatsAddress(), Secret: instance.Core.Secret, Running: instance.Core.Running, InstanceID: instance.ID, Version: instance.Core.Version}
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
	transport.Fail(w, errors.New("Экземпляр не найден"), 404)
}
