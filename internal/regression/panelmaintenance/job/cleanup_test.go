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

func TestCleanupWorkerFinishesWithoutChangingInstalledVersion(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux worker")
	}
	install := managed.New(t)
	install.Command("bash", `test "$2" = cleanup-images`)
	install.Command("docker", "exit 0")
	operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32), Busy: true, Operation: "cleanup", Phase: "queued"}, Commit: install.Current}
	if err := storage.Save(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	if err := job.Run(install.Root, operation.ID); err != nil {
		t.Fatal(err)
	}
	result, err := storage.Read(install.Root)
	current, currentErr := storage.Commit(install.Root)
	if err != nil || currentErr != nil || result.Busy || result.Phase != "success" || current != install.Current {
		t.Fatalf("invalid cleanup result: %+v %v", result, err)
	}
}
