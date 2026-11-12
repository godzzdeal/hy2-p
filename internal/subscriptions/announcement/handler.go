package announcement

import (
	"hy2-panel/internal/records"
	"hy2-panel/internal/subscriptions/routing"
	"hy2-panel/internal/transport"
	"net/http"

	"strings"
)

func (store *Store) Read(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, store.Current())
}
func (store *Store) Save(writer http.ResponseWriter, request *http.Request) {
	var next Settings
	if err := transport.Decode(writer, request, &next); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	next.Text = strings.TrimSpace(next.Text)
	next.ProfileTitle = strings.TrimSpace(next.ProfileTitle)
	current := store.Current()
	if next.Routing == nil {
		next.Routing = current.Routing
	} else {
		normalized, err := routing.Normalize(*next.Routing)
		if err != nil {
			transport.Fail(writer, err, 400)
			return
		}
		normalized.HasProfile = normalized.Enabled || (current.Routing != nil && current.Routing.HasProfile)
		next.Routing = &normalized
	}
	if err := validate(next); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	if err := records.Write(store.directory, "announcement", next); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	store.settings = next
	transport.Respond(writer, next)
}
