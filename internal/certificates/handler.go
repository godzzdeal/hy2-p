package certificates

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const MaxCertificateSize = 1 << 20

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
	var config map[string]any
	if err = yaml.Unmarshal([]byte(settings.Config), &config); err != nil {
		transport.Fail(writer, err, 400)
		return
	}
	paths := []string{}
	mode := "tls"
	if tlsConfig, ok := config["tls"].(map[string]any); ok {
		if path, ok := tlsConfig["cert"].(string); ok {
			paths = append(paths, path)
		}
	}
	if acmeConfig, ok := config["acme"].(map[string]any); ok {
		mode = "acme"
		directory, _ := acmeConfig["dir"].(string)
		if directory == "" {
			directory = filepath.Join(handler.Data, "acme-hy2")
		}
		count := 0
		filepath.WalkDir(directory, func(path string, entry os.DirEntry, walkErr error) error {
			count++
			if count > 512 {
				return filepath.SkipAll
			}
			if walkErr == nil && !entry.IsDir() && strings.HasSuffix(path, ".crt") {
				paths = append(paths, path)
			}
			return nil
		})
	}
	certificates := []map[string]any{}
	for _, path := range paths {
		if info, err := inspect(path); err == nil {
			certificates = append(certificates, info)
		}
	}
	transport.Respond(writer, map[string]any{"mode": mode, "automaticRenewal": mode == "acme", "certificates": certificates})
}
func inspect(path string) (map[string]any, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	payload, err := io.ReadAll(io.LimitReader(file, MaxCertificateSize))
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(payload)
	if block == nil || block.Type != "CERTIFICATE" {
		return nil, errors.New("неверный PEM сертификата")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}
	return map[string]any{"path": filepath.ToSlash(path), "domains": cert.DNSNames, "notAfter": cert.NotAfter.UTC().Format(time.RFC3339), "expired": time.Now().After(cert.NotAfter)}, nil
}
