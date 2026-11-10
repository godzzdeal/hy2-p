package job_test

import (
	"context"
	"hy2-panel/internal/panelmaintenance/job"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil/managed"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func TestCleanupProtectsCurrentRollbackContainersAndUnrelatedImages(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux maintenance script")
	}
	install := managed.New(t)
	stale, used, foreign := strings.Repeat("c", 40), strings.Repeat("d", 40), strings.Repeat("e", 40)
	for _, commit := range []string{stale, used} {
		install.Write("releases/"+commit+"/fixture", "owned release")
	}
	script, err := filepath.Abs("../../../../scripts/server/releases/source/cleanup.sh")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	command := exec.CommandContext(ctx, "bash", "-c", cleanupFixture)
	command.Env = append(os.Environ(), "HY2_INSTALL_DIR="+install.Root, "HY2_CLEANUP_SCRIPT="+script, "CURRENT="+install.Current, "PREVIOUS="+install.Previous, "STALE="+stale, "USED="+used, "FOREIGN="+foreign)
	if output, err := command.CombinedOutput(); err != nil {
		t.Fatalf("cleanup failed: %s %v", output, err)
	}
	removed, err := os.ReadFile(filepath.Join(install.Root, "removed"))
	if err != nil || strings.TrimSpace(string(removed)) != "hy2-panel:"+stale {
		t.Fatalf("unsafe removal: %s %v", removed, err)
	}
	previous, err := os.ReadFile(filepath.Join(install.Root, "previous"))
	if err != nil || string(previous) != install.Previous {
		t.Fatal("rollback marker changed")
	}
}

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

const cleanupFixture = `set -Eeuo pipefail
source "$HY2_CLEANUP_SCRIPT"
ROOT=$HY2_INSTALL_DIR
valid_sha() { [[ $1 =~ ^[a-f0-9]{40}$ ]]; }
image_for() { printf 'hy2-panel:%s\n' "$1"; }
die() { printf '%s\n' "$*" >&2; exit 1; }
log() { :; }
engine() {
 case "$1 $2" in
  'image ls') printf '%s\n' "$CURRENT" "$PREVIOUS" "$STALE" "$USED" "$FOREIGN" ;;
  'image inspect') printf '%s\n' "${!#}" | sed 's/^hy2-panel://' ;;
  'ps -aq') if [[ ${!#} == "ancestor=hy2-panel:$USED" ]]; then printf container; fi ;;
  'image rm') [[ $3 == "hy2-panel:$STALE" && $# == 3 ]]; printf '%s\n' "$3" >> "$ROOT/removed" ;;
  *) exit 9 ;;
 esac
}
cleanup_images "$CURRENT"
`
