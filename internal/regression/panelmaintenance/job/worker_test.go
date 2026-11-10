package job_test

import (
	"hy2-panel/internal/panelmaintenance/job"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil/managed"
	"runtime"
	"strings"
	"testing"
)

func TestWorkerChecksInstalledVersionAndReportsAutomaticRollback(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux worker")
	}
	for _, scenario := range []struct{ name, script, phase string }{
		{"success", `printf '%s' '` + strings.Repeat("b", 40) + `' > "$HY2_INSTALL_DIR/current"`, "success"},
		{"rollback", "exit 10", "rolled_back"}, {"wrong-version", "exit 0", "failed"},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			install := managed.New(t)
			install.Write("releases/"+install.Previous+"/internal/buildinfo/VERSION", "v0.7.6")
			t.Setenv("HY2_INSTALL_DIR", install.Root)
			install.Command("bash", scenario.script)
			install.Command("docker", "exit 0")
			operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32), Busy: true, Operation: "update", Phase: "queued"}, Version: "v0.7.6", Commit: install.Current}
			if err := storage.Save(install.Root, operation); err != nil {
				t.Fatal(err)
			}
			if err := job.Run(install.Root, operation.ID); err != nil {
				t.Fatal(err)
			}
			result, err := storage.Read(install.Root)
			if err != nil || result.Busy || result.Phase != scenario.phase {
				t.Fatalf("bad result: %+v %v", result, err)
			}
		})
	}
}
func TestInterruptedWorkerRecoversInsteadOfRepeatingAnUpdate(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux worker")
	}
	install := managed.New(t)
	install.Command("bash", `test "$2" = start-panel`)
	install.Command("docker", "exit 0")
	operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32), Busy: true, Operation: "update", Phase: "updating"}, Version: "v0.7.6", Commit: install.Current}
	if err := storage.Save(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	if err := job.Run(install.Root, operation.ID); err != nil {
		t.Fatal(err)
	}
	result, err := storage.Read(install.Root)
	if err != nil || result.Busy || result.Phase != "rolled_back" {
		t.Fatalf("recovery failed: %+v %v", result, err)
	}
}
