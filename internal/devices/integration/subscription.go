package integration

import (
	"encoding/base64"
	"errors"
	"hy2-panel/internal/devices/model"
	"hy2-panel/internal/users"
	"net/http"
)

func (handler *Handler) Prepare(w http.ResponseWriter, r *http.Request, user users.User) (users.User, bool) {
	if handler.Store.Limit(user.ID) > 0 {
		w.Header().Set("subscription-always-hwid-enable", "1")
		w.Header().Set("x-hwid-active", "true")
	}
	password, err := handler.Store.Admit(user.ID, user.Password, r)
	if err == nil {
		user.Password = password
		return user, true
	}
	switch {
	case errors.Is(err, model.ErrMissingHWID):
		w.Header().Set("x-hwid-not-supported", "true")
	case errors.Is(err, model.ErrLimitReached), errors.Is(err, model.ErrBlocked), errors.Is(err, model.ErrRegistryFull):
		w.Header().Set("x-hwid-max-devices-reached", "true")
		w.Header().Set("x-hwid-limit", "true")
	default:
		http.Error(w, "Subscription temporarily unavailable", 503)
		return user, false
	}
	w.Header().Set("announce", "base64:"+base64.StdEncoding.EncodeToString([]byte(err.Error())))
	http.Error(w, err.Error(), http.StatusForbidden)
	return user, false
}
