package portcontrol_test

import (
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/portcontrol/protocol"
	"testing"
)

func TestNumericPortsAndConfigurationScope(t *testing.T) {
	for _, port := range []string{"0", "65536", "061254", "61254;sh", "443/udp", "-1"} {
		if (protocol.Request{PublicPort: port, ListenPort: "61254"}).Validate() == nil {
			t.Fatalf("accepted %q", port)
		}
	}
	first := configuration.Settings{Config: "listen: :61254\ntls: {cert: a, key: b}"}
	second := first
	second.Config = "listen: :443\ntls: {cert: a, key: b}"
	if deployment.Fingerprint(first) != deployment.Fingerprint(second) {
		t.Fatal("port-only change rejected")
	}
	second.Config = "listen: 127.0.0.1:443\ntls: {cert: a, key: b}"
	if deployment.Fingerprint(first) == deployment.Fingerprint(second) {
		t.Fatal("bind address change accepted as port-only")
	}
	document := map[string]any{"listen": ":61254"}
	deployment.RuntimeListen(document, "8443")
	if document["listen"] != ":8443" {
		t.Fatal("active rollback port not preserved")
	}
}
