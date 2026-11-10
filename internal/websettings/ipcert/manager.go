package ipcert

import (
	"context"
	"crypto/tls"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/caddyserver/certmagic"
)

const certificateProfile = "shortlived"

// New limits issuance to the configured IP and retains account keys and renewals on disk.
// Issuance starts once the HTTP challenge listener is bound, independently of TLS handshakes.
func New(directory, address, email, host string, port int) (*tls.Config, *http.Server, func(), error) {
	magic, issuer, cache := configuration(directory, address, email, host, port)
	ctx, cancel := context.WithCancel(context.Background())
	closeTLS := func() { cancel(); cache.Stop() }
	config := magic.TLSConfig()
	config.MinVersion = tls.VersionTLS12
	challenge := &http.Server{
		Addr: net.JoinHostPort(host, strconv.Itoa(port)), Handler: issuer.HTTPChallengeHandler(http.NotFoundHandler()),
		ReadHeaderTimeout: 5 * time.Second,
		BaseContext: func(net.Listener) context.Context {
			if err := magic.ManageAsync(ctx, []string{address}); err != nil {
				log.Printf("IP certificate management: %v", err)
			}
			return ctx
		},
	}
	return config, challenge, closeTLS, nil
}

func configuration(directory, address, email, host string, port int) (*certmagic.Config, *certmagic.ACMEIssuer, *certmagic.Cache) {
	var magic *certmagic.Config
	cache := certmagic.NewCache(certmagic.CacheOptions{
		GetConfigForCert: func(certmagic.Certificate) (*certmagic.Config, error) { return magic, nil },
	})
	magic = certmagic.New(cache, certmagic.Config{
		Storage: &certmagic.FileStorage{Path: directory}, DefaultServerName: address,
	})
	issuer := certmagic.NewACMEIssuer(magic, certmagic.ACMEIssuer{
		CA: certmagic.LetsEncryptProductionCA, Email: email, Agreed: true, Profile: certificateProfile,
		DisableTLSALPNChallenge: true, ListenHost: host, AltHTTPPort: port,
	})
	magic.Issuers = []certmagic.Issuer{issuer}
	return magic, issuer, cache
}
