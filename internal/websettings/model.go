package websettings

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"hy2-panel/internal/security"
	"net"
	"net/netip"
	"net/url"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Host          string `json:"host"`
	Port          int    `json:"port"`
	Mode          string `json:"mode"`
	Domain        string `json:"domain"`
	Email         string `json:"email"`
	ChallengePort int    `json:"challengePort"`
	Certificate   string `json:"certificate"`
	PrivateKey    string `json:"privateKey,omitempty"`
	AcceptedTerms bool   `json:"acceptedTerms"`
	PublicURL     string `json:"publicURL"`
}

func Validate(config Config) error {
	if config.Host != "127.0.0.1" && config.Host != "0.0.0.0" && config.Host != "::" && config.Host != "::1" {
		return errors.New("выберите допустимый адрес прослушивания")
	}
	if config.Port < 1 || config.Port > 65535 || security.ReservedTCPPort(config.Port) {
		return errors.New("порт панели недопустим или зарезервирован")
	}
	if config.Mode != "http" && config.Mode != "manual" && config.Mode != "acme" {
		return errors.New("неверный режим HTTPS")
	}
	address, ipError := netip.ParseAddr(config.Domain)
	if config.Mode != "http" && (config.Domain == "" || (ipError != nil && strings.ContainsAny(config.Domain, " /:@*[]"))) {
		return errors.New("для HTTPS укажите домен или IP без схемы и порта")
	}
	if config.Mode == "manual" {
		pair, err := tls.X509KeyPair([]byte(config.Certificate), []byte(config.PrivateKey))
		if err != nil {
			return err
		}
		leaf, err := x509.ParseCertificate(pair.Certificate[0])
		if err != nil {
			return err
		}
		if err = leaf.VerifyHostname(config.Domain); err != nil {
			return err
		}
	}
	if config.Mode == "acme" {
		if ipError == nil && (!address.IsGlobalUnicast() || address.IsPrivate() || address.IsLoopback() || address.IsLinkLocalUnicast() || address.Is4In6() || address.Zone() != "") {
			return errors.New("для сертификата ACME на IP укажите публичный IPv4 или IPv6")
		}
		if !config.AcceptedTerms {
			return errors.New("подтвердите условия Let's Encrypt")
		}
		if config.Email == "" {
			return errors.New("для ACME укажите email")
		}

	}
	if config.Mode == "acme" || os.Getenv("PANEL_CONTAINER") == "true" {
		if config.ChallengePort < 1 || config.ChallengePort > 65535 || config.ChallengePort == config.Port || security.ReservedTCPPort(config.ChallengePort) {
			return errors.New("неверный HTTP-порт ACME")
		}
	}
	if config.PublicURL != "" {
		address, err := url.Parse(config.PublicURL)
		if err != nil || address.Host == "" || (address.Scheme != "http" && address.Scheme != "https") || address.User != nil || address.RawQuery != "" || address.Fragment != "" || (address.Path != "" && address.Path != "/") {
			return errors.New("публичный URL должен содержать http(s)://домен:порт без пути")
		}
	}
	return nil
}
func (config Config) Address() string {
	return net.JoinHostPort(config.ListenHost(), strconv.Itoa(config.Port))
}
func (config Config) ListenHost() string {
	if os.Getenv("PANEL_CONTAINER") == "true" {
		return "0.0.0.0"
	}
	return config.Host
}
func (config Config) URL() string {
	if config.PublicURL != "" {
		return strings.TrimRight(config.PublicURL, "/")
	}
	host := config.Domain
	if host == "" {
		host = "localhost"
	}
	scheme := "http"
	if config.Mode != "http" {
		scheme = "https"
	}
	return scheme + "://" + net.JoinHostPort(host, strconv.Itoa(config.Port))
}

func environment(config Config) (Config, error) {
	if os.Getenv("PANEL_CONTAINER") == "true" && os.Getenv("PANEL_BIND_HOST") != "" {
		config.Host = os.Getenv("PANEL_BIND_HOST")
	}
	if mode := os.Getenv("PANEL_TLS_MODE"); mode != "" {
		config.Mode = mode
	}
	config.Domain = os.Getenv("PANEL_DOMAIN")
	config.Email = os.Getenv("PANEL_ACME_EMAIL")
	config.AcceptedTerms = os.Getenv("PANEL_ACME_ACCEPT_TERMS") == "true"
	if value := os.Getenv("PANEL_ACME_PORT"); value != "" {
		port, err := strconv.Atoi(value)
		if err != nil {
			return config, err
		}
		config.ChallengePort = port
	}
	return config, nil
}
