package certificates

import (
	"crypto/tls"
	"crypto/x509"
	"hy2-panel/internal/certificates/files"
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
	Data   string
	Config *configuration.Handler
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
	mode, paths, err := files.Sources(settings.Config, handler.Data)
	if err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	certificates := []files.Certificate{}
	for _, path := range paths {
		if info, err := files.Read(path); err == nil {
			certificates = append(certificates, info)
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
	transport.Respond(writer, map[string]any{"mode": mode, "automaticRenewal": mode == "acme", "certificates": certificates, "pinSHA256": pin, "pinError": message})
}
