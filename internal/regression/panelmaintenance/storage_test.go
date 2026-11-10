package panelmaintenance_test

import (
	"encoding/json"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil/managed"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMaintenanceSurvivesRollbackAndPreservesLegacyPortState(t *testing.T) {
	install := managed.New(t)
	legacy := `{"id":"port-operation","busy":false,"phase":"success"}`
	install.Write("udp-operation.json", legacy)
	operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32), Operation: "update", Busy: true, Phase: "queued"}, Version: "v0.7.6", Commit: install.Current}
	if err := storage.Save(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	restored, err := storage.Read(install.Root)
	if err != nil || restored.ID != operation.ID || !restored.Busy {
		t.Fatalf("lost operation: %+v %v", restored, err)
	}
	bytes, err := os.ReadFile(filepath.Join(install.Root, "udp-operation.json"))
	if err != nil || string(bytes) != legacy {
		t.Fatal("maintenance changed UDP recovery state")
	}
	var oldClient struct {
		ID    string `json:"id"`
		Busy  bool   `json:"busy"`
		Phase string `json:"phase"`
	}
	bytes, err = os.ReadFile(filepath.Join(install.Root, "udp-history", operation.ID+".json"))
	if err != nil || json.Unmarshal(bytes, &oldClient) != nil || oldClient.ID != operation.ID || !oldClient.Busy {
		t.Fatal("progress unavailable to older panels")
	}
}
func TestRollbackRequiresAnExistingBackup(t *testing.T) {
	install := managed.New(t)
	info, err := storage.Installation(install.Root)
	if err != nil || !info.RollbackAvailable || info.Previous != "v0.7.4" || info.Current != "v0.7.5" || info.BackupCreated == "" {
		t.Fatalf("invalid installation: %+v %v", info, err)
	}
	if err := os.Remove(filepath.Join(install.Root, "backups/fixture/data.tar.gz")); err != nil {
		t.Fatal(err)
	}
	info, err = storage.Installation(install.Root)
	if err != nil || info.RollbackAvailable {
		t.Fatal("missing backup accepted")
	}
}
