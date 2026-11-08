package integration

import (
	"errors"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
)

func (handler *Handler) Read(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, handler.Store.Snapshot())
}
func (handler *Handler) Save(writer http.ResponseWriter, request *http.Request) {
	var group groups.Group
	if err := transport.Decode(writer, request, &group); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	group.ID = request.PathValue("group")
	if request.Method == "POST" {
		group.ID = security.Token()[:16]
	} else {
		exists := false
		for _, current := range handler.Store.Snapshot().Groups {
			exists = exists || current.ID == group.ID
		}
		if !exists {
			transport.Fail(writer, errors.New("Группа не найдена"), 404)
			return
		}
	}
	if err := group.Validate(); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	for _, id := range group.Access.Instances {
		instance, err := handler.Registry.Get(id)
		if err != nil || instance.Removing {
			transport.Fail(writer, errors.New("Ядро недоступно"), 409)
			return
		}
		settings, err := instance.Config.Get()
		if err != nil || settings.AuthMode == "native" {
			transport.Fail(writer, errors.New("Выберите ядра с пользователями панели"), 409)
			return
		}
	}
	if group.DeviceLimit > 0 {
		for user, id := range handler.Store.Snapshot().Memberships {
			if id == group.ID && handler.activeDevices(user) > group.DeviceLimit {
				transport.Fail(writer, errors.New("Сначала отключите лишние устройства участников группы"), 409)
				return
			}
		}
	}
	if err := handler.Store.Put(group); err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	transport.Respond(writer, handler.Store.Snapshot())
}
func (handler *Handler) Remove(writer http.ResponseWriter, request *http.Request) {
	if err := handler.Store.Remove(request.PathValue("group")); err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	transport.Respond(writer, handler.Store.Snapshot())
}
func (handler *Handler) Assign(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		GroupID string `json:"groupId"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	user := request.PathValue("id")
	if _, err := handler.Users.User(user); err != nil {
		transport.Fail(writer, errors.New("Пользователь не найден"), 404)
		return
	}
	for _, group := range handler.Store.Snapshot().Groups {
		if group.ID == input.GroupID && group.DeviceLimit > 0 && handler.activeDevices(user) > group.DeviceLimit {
			transport.Fail(writer, errors.New("Сначала отключите лишние устройства пользователя"), 409)
			return
		}
	}
	if err := handler.Store.Assign(user, input.GroupID); err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	handler.Registry.Kick(user)
	transport.Respond(writer, handler.Store.Snapshot())
}
func (handler *Handler) activeDevices(user string) int {
	count := 0
	for _, device := range handler.Devices.Snapshot(user).Devices {
		if !device.Blocked {
			count++
		}
	}
	return count
}
