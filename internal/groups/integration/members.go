package integration

import (
	"errors"
	"hy2-panel/internal/groups"
	"hy2-panel/internal/transport"
	"net/http"
)

func (handler *Handler) Members(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		UserIDs []string `json:"userIds"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	if input.UserIDs == nil || len(input.UserIDs) > groups.MaxMembers {
		transport.Fail(writer, errors.New("Укажите список пользователей"), 400)
		return
	}
	id := request.PathValue("group")
	var target *groups.Group
	for _, group := range handler.Store.Snapshot().Groups {
		if group.ID == id {
			target = &group
			break
		}
	}
	if target == nil {
		transport.Fail(writer, errors.New("Группа не найдена"), 404)
		return
	}
	users, err := handler.Users.All()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	known := make(map[string]bool, len(users))
	for _, user := range users {
		known[user.ID] = true
	}
	for _, user := range input.UserIDs {
		if !known[user] {
			transport.Fail(writer, errors.New("Пользователь не найден"), 404)
			return
		}
		if target.DeviceLimit > 0 && handler.activeDevices(user) > target.DeviceLimit {
			transport.Fail(writer, errors.New("Сначала отключите лишние устройства участников группы"), 409)
			return
		}
	}
	if err := handler.Store.SetMembers(id, input.UserIDs); err != nil {
		transport.Fail(writer, err, 409)
		return
	}
	transport.Respond(writer, handler.Store.Snapshot())
}
