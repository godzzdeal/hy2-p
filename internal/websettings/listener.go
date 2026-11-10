package websettings

import (
	"crypto/tls"
	"golang.org/x/crypto/acme/autocert"
	"hy2-panel/internal/websettings/ipcert"
	"net"
	"net/http"
	"path/filepath"
	"strconv"
)

func (handler *Handler) TLS() (*tls.Config, *http.Server, error) {
	config := handler.Active()
	if config.Mode == "http" {
		return nil, nil, nil
	}
	if config.Mode == "manual" {
		pair, err := tls.X509KeyPair([]byte(config.Certificate), []byte(config.PrivateKey))
		if err != nil {
			return nil, nil, err
		}
		return &tls.Config{MinVersion: tls.VersionTLS12, Certificates: []tls.Certificate{pair}}, nil, nil
	}
	if net.ParseIP(config.Domain) != nil {
		tlsConfig, challenge, closeTLS, err := ipcert.New(filepath.Join(handler.directory, "acme-ip"), config.Domain, config.Email, config.ListenHost(), config.ChallengePort)
		handler.closeTLS = closeTLS
		return tlsConfig, challenge, err
	}
	manager := &autocert.Manager{Prompt: autocert.AcceptTOS, Email: config.Email, HostPolicy: autocert.HostWhitelist(config.Domain), Cache: autocert.DirCache(filepath.Join(handler.directory, "acme"))}
	challenge := &http.Server{Addr: net.JoinHostPort(config.ListenHost(), strconv.Itoa(config.ChallengePort)), Handler: manager.HTTPHandler(http.NotFoundHandler()), ReadHeaderTimeout: 5e9}
	tlsConfig := manager.TLSConfig()
	tlsConfig.MinVersion = tls.VersionTLS12
	return tlsConfig, challenge, nil
}
