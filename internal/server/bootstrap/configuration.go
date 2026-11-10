package bootstrap

import (
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/ordering"
	"hy2-panel/internal/websettings"
	"net"
	"net/url"
)

func InitialConfiguration(web websettings.Config) configuration.Settings {
	host := web.Domain
	if host == "" {
		if address, err := url.Parse(web.PublicURL); err == nil {
			host = address.Hostname()
		}
	}
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		host = ""
	}
	settings := configuration.Settings{Host: host, SNI: host, Port: "8443", Config: "listen: :8443\ntls:\n  cert: /certs/server.crt\n  key: /certs/server.key\n"}
	if web.Mode == "acme" && host != "" && net.ParseIP(host) == nil {
		value := map[string]any{"listen": ":8443", "acme": map[string]any{"domains": []string{host}, "email": web.Email, "ca": "letsencrypt", "type": "http", "dir": "/data/acme-hy2"}}
		if source, err := ordering.Marshal(value); err == nil {
			settings.Config = string(source)
		}
	}
	return settings
}
