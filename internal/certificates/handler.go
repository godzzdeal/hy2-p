package certificates

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"hy2-panel/internal/certificates/files"
	"hy2-panel/internal/certificates/management"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const MaxCertificateSize = files.MaxCertificateSize

type Handler struct {
	Data       string
	Config     *configuration.Handler
	References []management.Reference
}

func (handler *Handler) Upload(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Certificate string `json:"certificate"`
		PrivateKey  string `json:"privateKey"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	pair, err := tls.X509KeyPair([]byte(input.Certificate), []byte(input.PrivateKey))
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	leaf, err := x509.ParseCertificate(pair.Certificate[0])
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	directory := filepath.Join(handler.Data, "certificates", security.Token())
	if err = os.MkdirAll(directory, 0700); err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	certPath := filepath.Join(directory, "server.crt")
	keyPath := filepath.Join(directory, "server.key")
	if err = os.WriteFile(certPath, []byte(input.Certificate), 0600); err == nil {
		err = os.WriteFile(keyPath, []byte(input.PrivateKey), 0600)
	}
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	transport.Respond(writer, map[string]any{"certificatePath": filepath.ToSlash(certPath), "keyPath": filepath.ToSlash(keyPath), "notAfter": leaf.NotAfter.UTC().Format(time.RFC3339)})
}
func (handler *Handler) Inspect(writer http.ResponseWriter, request *http.Request) {
	settings, err := handler.Config.Get()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	mode, entries, err := management.List(settings.Config, handler.Data, handler.references(settings.Config))
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	certificates := []files.Certificate{}
	for _, entry := range entries {
		if entry.FromSource {
			certificates = append(certificates, entry.Certificate)
		}
	}
	name := settings.SNI
	if name == "" {
		name = settings.Host
	}
	pin, pinError := files.Pin(mode, certificates, name)
	message := ""
	if pinError != nil {
		message = pinError.Error()
	}
	transport.Respond(writer, map[string]any{"mode": mode, "automaticRenewal": mode == "acme", "certificates": entries, "pinSHA256": pin, "pinError": message})
}

func (handler *Handler) references(source string) []management.Reference {
	if handler.References != nil {
		return handler.References
	}
	return []management.Reference{{Source: source, Data: handler.Data}}
}

func (handler *Handler) Delete(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		ID string `json:"id"`
	}
	if err := transport.Decode(writer, request, &input); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	settings, err := handler.Config.Get()
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	_, entries, err := management.List(settings.Config, handler.Data, handler.references(settings.Config))
	if err != nil {
		transport.Fail(writer, err, 500)
		return
	}
	for _, entry := range entries {
		if entry.ID != input.ID {
			continue
		}
		if !entry.CanDelete {
			transport.Fail(writer, errors.New(entry.DeleteReason), 409)
			return
		}
		if err := management.Remove(handler.Data, entry); err != nil {
			transport.Fail(writer, err, 500)
			return
		}
		transport.Respond(writer, map[string]bool{"ok": true})
		return
	}
	transport.Fail(writer, errors.New("Сертификат не найден"), 404)
}
