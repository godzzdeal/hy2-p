package announcement

import (
	"hy2-panel/internal/records"
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
