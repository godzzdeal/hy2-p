package panelmaintenance_test

import (
	"hy2-panel/internal/portcontrol/protocol"
	"testing"
)

func TestPanelOperationsRejectUntrustedTargetsAndRequireRestoreConsent(t *testing.T) {
	for _, request := range []protocol.PanelRequest{{Action: "update", Version: "main"}, {Action: "update", Version: "v01.2.3"}, {Action: "update", Version: "https://example.com"}, {Action: "update", Version: "v0.7.6;id"}, {Action: "rollback"}, {Action: "stop"}, {Action: "cleanup", Version: "v0.7.5"}, {Action: "cleanup", RestoreData: true}} {
		if err := request.Validate(); err == nil {
			t.Fatal("unsafe operation accepted", request)
		}
	}
	for _, request := range []protocol.PanelRequest{{Action: "update", Version: "v0.7.6"}, {Action: "rollback", RestoreData: true}, {Action: "cleanup"}} {
		if err := request.Validate(); err != nil {
			t.Fatal(err)
		}
	}
}
