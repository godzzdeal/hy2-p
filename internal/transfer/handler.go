package transfer

import (
	"encoding/json"
	"errors"
	"hy2-panel/internal/transfer/model"
	"hy2-panel/internal/transport"
	"io"
	"mime"
	"net"
	"net/http"
	"time"
)

type Request struct {
	Bundle      model.Bundle `json:"bundle"`
	Fingerprint string       `json:"fingerprint"`
}

func (service *Service) Download(w http.ResponseWriter, r *http.Request) {
	bundle, err := service.Export()
	if err != nil {
		transport.Fail(w, errors.New("Не удалось экспортировать данные панели"), 500)
		return
	}
	payload, err := json.Marshal(bundle)
	if err != nil || len(payload) > model.MaxBytes {
		transport.Fail(w, errors.New("Размер экспорта превышает 16 МБ"), 413)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	server := r.Host
	if host, _, err := net.SplitHostPort(server); err == nil {
		server = host
	}
	filename := model.DownloadFilename(server, "hy2-p.json", payload, time.Now())
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": filename}))
	w.Header().Set("Content-Type", "application/json")
	w.Write(payload)
}
func (service *Service) Import(w http.ResponseWriter, r *http.Request) {
	// Bulk imports may outlast the general panel timeout; other routes keep it.
	_ = http.NewResponseController(w).SetWriteDeadline(time.Now().Add(model.OperationTimeout))
	// Leave room for the request envelope, fingerprint and explicit core mappings.
	r.Body = http.MaxBytesReader(w, r.Body, model.MaxBytes+(4<<10))
	var input Request
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if decoder.Decode(&input) != nil || decoder.Decode(new(any)) != io.EOF {
		transport.Fail(w, errors.New("Некорректный файл импорта или превышен размер 16 МБ"), 400)
		return
	}
	var result model.Preview
	var err error
	if r.PathValue("mode") == "apply" {
		result, err = service.Apply(input.Bundle, input.Fingerprint)
	} else {
		result, err = service.Preview(input.Bundle)
	}
	if err != nil {
		transport.Fail(w, err, 409)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	transport.Respond(w, result)
}
