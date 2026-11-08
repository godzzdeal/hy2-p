package firewall

import "testing"

func TestChangesRejectCommandsAndUnknownActions(t *testing.T) {
	for _, change := range []Change{{0, "tcp", "allow"}, {65536, "udp", "deny"}, {22, "tcp;id", "allow"}, {80, "tcp", "reset"}} {
		if change.Validate() == nil {
			t.Fatal(change)
		}
	}
	for _, change := range []Change{{443, "tcp", "allow"}, {61254, "udp", "deny"}} {
		if err := change.Validate(); err != nil {
			t.Fatal(err)
		}
	}
}
