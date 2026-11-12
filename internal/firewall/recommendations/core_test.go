package recommendations

import (
	"hy2-panel/internal/configuration"
	"testing"
)

func TestCorePortsRespectPublishingAndACME(t *testing.T) {
	tests := []struct {
		name, config, published string
		container               bool
		want                    []Port
	}{
		{"container pending UDP and HTTP", "listen: :61254\nacme: {type: http}\ntrafficStats: {listen: ':9999'}\n", "8443", true, []Port{{8443, "udp", "vpn", "", false}, {61254, "udp", "vpn", "", true}, {80, "tcp", "acme-http", "", false}}},
		{"DNS ACME needs no inbound TCP", "listen: :61254\nacme: {type: dns}\n", "61254", true, []Port{{61254, "udp", "vpn", "", false}}},
		{"TLS ACME needs TCP 443", "listen: :61254\nacme: {type: tls}\n", "61254", true, []Port{{61254, "udp", "vpn", "", false}, {443, "tcp", "acme-tls", "", false}}},
		{"native uses actual listen", "listen: :8443\ntls: {}\n", "", false, []Port{{8443, "udp", "vpn", "", false}}},
		{"mimic needs both protocols", "listen: :8443\nmimic: {enabled: true}\n", "", false, []Port{{8443, "udp", "vpn", "", false}, {8443, "tcp", "vpn", "", false}}},
		{"local listeners stay private", "listen: '127.0.0.1:8443'\nmasquerade: {listenHTTP: '127.0.0.1:8080'}\n", "", false, []Port{}},
		{"optional masquerade requires publishing", "listen: :8443\nmasquerade: {listenHTTP: ':8080', listenHTTPS: ':8444'}\n", "61254", true, []Port{{61254, "udp", "vpn", "", false}, {8080, "tcp", "masquerade-http", "", true}, {8444, "tcp", "masquerade-https", "", true}}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := Core(configuration.Settings{Port: "61254", Config: test.config}, test.published, test.container)
			if err != nil || len(got) != len(test.want) {
				t.Fatalf("got %#v, %v", got, err)
			}
			for index := range got {
				if got[index] != test.want[index] {
					t.Fatalf("got %#v, want %#v", got, test.want)
				}
			}
		})
	}
}
