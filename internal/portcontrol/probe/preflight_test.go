package probe

import (
	"hy2-panel/internal/portcontrol/protocol"
	"strings"
	"testing"
)

func TestStartupOnlyWaitsForAnActiveUDPApplication(t *testing.T) {
	id := strings.Repeat("a", 32)
	active := protocol.Status{ID: id, Busy: true, Phase: "applying", PublicPort: "61254", ListenPort: "8443"}
	for _, scenario := range []struct {
		name     string
		state    protocol.Status
		expected bool
	}{
		{"UDP application", active, true},
		{"update from older worker", protocol.Status{ID: id, Busy: true, Operation: "update"}, false},
		{"rollback from older worker", protocol.Status{ID: id, Busy: true, Operation: "rollback"}, false},
		{"restart from older worker", protocol.Status{ID: id, Busy: true, Operation: "restart"}, false},
		{"old completed operation", protocol.Status{ID: id, PublicPort: "61254", ListenPort: "8443"}, false},
		{"another UDP operation", protocol.Status{ID: strings.Repeat("b", 32), Busy: true, PublicPort: "61254", ListenPort: "8443"}, false},
		{"port removal", protocol.Status{ID: id, Busy: true, Remove: true, PublicPort: "61254", ListenPort: "8443"}, false},
		{"no target port", protocol.Status{ID: id, Busy: true, PublicPort: "61254"}, false},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			if requiresUDPProbe(scenario.state, id) != scenario.expected {
				t.Fatal("incorrect startup probe decision")
			}
		})
	}
}
