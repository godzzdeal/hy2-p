package firewall

import (
	"bytes"
	"encoding/json"
	"errors"
	"hy2-panel/internal/transport"
	"io"
	"net/http"
)

type Change struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Action   string `json:"action"`
}

func (change Change) Validate() error {
	if change.Port < 1 || change.Port > 65535 || (change.Protocol != "tcp" && change.Protocol != "udp") || (change.Action != "allow" && change.Action != "deny") {
		return errors.New("Укажите порт 1–65535, TCP/UDP и действие allow/deny")
	}
	return nil
}
func body(w http.ResponseWriter, r *http.Request) (io.Reader, error) {
	if r.Method == "GET" {
		return nil, nil
	}
	var change Change
	if err := transport.Decode(w, r, &change); err != nil {
		return nil, err
	}
	if err := change.Validate(); err != nil {
		return nil, err
	}
	data, err := json.Marshal(change)
	return bytes.NewReader(data), err
}
