package integration

import (
	"hy2-panel/internal/devices"
	deviceapi "hy2-panel/internal/devices/integration"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transport"
	useraccess "hy2-panel/internal/useraccess/integration"
	"hy2-panel/internal/users"
	"net/http"
)

type Handler struct {
	Store    *groups.Store
	Registry *instances.Registry
	Users    *users.Handler
	Devices  *devices.Store
	Traffic  *traffic.Service
}

func Open(data string, registry *instances.Registry, users *users.Handler, access *useraccess.Handler, devices *deviceapi.Handler, traffic *traffic.Service) (*Handler, error) {
	store, err := groups.Open(data)
	if err != nil {
		return nil, err
	}
	access.GroupAllows = store.Allows
	users.AllowCore = access.Allows
	devices.Store.GroupLimit = store.DeviceLimit
	traffic.GroupLimit = store.TrafficLimit
	return &Handler{Store: store, Registry: registry, Users: users, Devices: devices.Store, Traffic: traffic}, nil
}
func (handler *Handler) ReadTraffic(writer http.ResponseWriter, request *http.Request) {
	snapshot := handler.Traffic.Snapshot()
	for user := range handler.Store.Snapshot().Memberships {
		if _, exists := snapshot.Users[user]; !exists {
			snapshot.Users[user] = traffic.Usage{GroupLimit: handler.Store.TrafficLimit(user)}
		}
	}
	transport.Respond(writer, snapshot)
}
