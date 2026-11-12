package recommendations

import (
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"net"
)

func Core(settings configuration.Settings, published string, container bool) ([]Port, error) {
	var config struct {
		Listen string `yaml:"listen"`
		Mimic  struct {
			Enabled bool `yaml:"enabled"`
		} `yaml:"mimic"`
		ACME *struct {
			Type string `yaml:"type"`
		} `yaml:"acme"`
		Masquerade struct {
			ListenHTTP  string `yaml:"listenHTTP"`
			ListenHTTPS string `yaml:"listenHTTPS"`
		} `yaml:"masquerade"`
	}
	if err := yaml.Unmarshal([]byte(settings.Config), &config); err != nil {
		return nil, err
	}
	report := Report{Ports: []Port{}}
	if container {
		report.add(portNumber(published), "udp", "vpn", "", false)
		if settings.Port != published {
			report.add(portNumber(settings.Port), "udp", "vpn", "", true)
		}
	} else {
		listen := config.Listen
		if listen == "" {
			listen = deployment.DefaultListen
		}
		if port := publicListener(listen); port != 0 {
			report.add(port, "udp", "vpn", "", false)
		}
	}
	if config.Mimic.Enabled {
		for _, port := range report.Ports {
			if port.Purpose == "vpn" {
				report.add(port.Port, "tcp", "vpn", "", port.Pending)
			}
		}
	}
	if config.ACME != nil {
		switch config.ACME.Type {
		case "", "http":
			report.add(80, "tcp", "acme-http", "", false)
		case "tls":
			report.add(443, "tcp", "acme-tls", "", false)
		}
	}
	// These TCP listeners are optional. A Docker installation must also publish them.
	report.add(publicListener(config.Masquerade.ListenHTTP), "tcp", "masquerade-http", "", container)
	report.add(publicListener(config.Masquerade.ListenHTTPS), "tcp", "masquerade-https", "", container)
	return report.Ports, nil
}
func publicListener(value string) int {
	host, port, err := net.SplitHostPort(value)
	if err != nil || host == "localhost" {
		return 0
	}
	address := net.ParseIP(host)
	if address != nil && address.IsLoopback() {
		return 0
	}
	return portNumber(port)
}
