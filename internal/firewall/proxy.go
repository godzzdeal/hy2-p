package firewall

import (
	"context"
	"errors"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"io"
	"net"
	"net/http"
	"path/filepath"
	"time"
)

// Only a fixed endpoint and validated numeric ports reach the host service.
func Proxy(socket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		payload, err := body(w, r)
		if err != nil {
			transport.Fail(w, err, 400)
			return
		}
		connection := &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, "unix", socket)
		}}
		defer connection.CloseIdleConnections()
		client := &http.Client{Transport: connection, Timeout: 25 * time.Second}
		request, err := http.NewRequestWithContext(r.Context(), r.Method, "http://local/firewall", payload)
		if err != nil {
			transport.Fail(w, err, 400)
			return
		}
		request.Header.Set("Content-Type", "application/json")
		response, err := client.Do(request)
		if err != nil {
			transport.Fail(w, errors.New("Помощник firewall недоступен"), 503)
			return
		}
		defer response.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(response.StatusCode)
		io.Copy(w, io.LimitReader(response.Body, 1<<20))
	}
}
func Host(root string) http.HandlerFunc {
	return Proxy(filepath.Join(root, "firewall", "control.sock"))
}
func Panel() http.HandlerFunc { return Proxy(protocol.Socket) }
