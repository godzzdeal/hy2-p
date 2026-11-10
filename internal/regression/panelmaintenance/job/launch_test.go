package job_test

import (
	"hy2-panel/internal/panelmaintenance/job"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil/managed"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestLaunchIsDetachedAndScopedToTheInstalledImage(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux worker")
	}
	install := managed.New(t)
	t.Setenv("HY2_INSTALL_DIR", install.Root)
	install.Command("docker", `case "$3" in
inspect) exit 1 ;;
run) printf '%s\n' "$@" > "$HY2_INSTALL_DIR/worker-arguments" ;;
esac`)
	operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32)}, Commit: install.Current}
	if err := job.Launch(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	payload, err := os.ReadFile(filepath.Join(install.Root, "worker-arguments"))
	if err != nil {
		t.Fatal(err)
	}
	for _, required := range []string{"--detach\n", "--restart\nalways\n", "--pull\nnever\n", "hy2-panel:" + install.Current, "HY2_INSTALL_DIR=" + install.Root, "maintenance\n" + operation.ID} {
		if !strings.Contains(string(payload), required) {
			t.Fatalf("missing %q: %s", required, payload)
		}
	}
	if strings.Contains(string(payload), "--privileged") || strings.Contains(string(payload), "--network\nhost") {
		t.Fatal("unnecessary worker privileges")
	}
	operation.Commit = "latest;sh"
	if job.Launch(install.Root, operation) == nil {
		t.Fatal("untrusted image accepted")
	}
}
