package panelmaintenance

import (
	"context"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil/managed"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestAutomaticCleanupWaitsForCompletedDeploymentAndSkipsMaintainedImages(t *testing.T) {
	install := managed.New(t)
	service := &Service{Root: install.Root}
	expected := install.Current + ":" + install.Previous
	if service.cleanupKey() != expected {
		t.Fatal("new installation is not scheduled for cleanup")
	}
	install.Write("update.pending", "pending")
	if service.cleanupKey() != "" {
		t.Fatal("cleanup overlaps a pending update")
	}
	if err := os.Remove(filepath.Join(install.Root, "update.pending")); err != nil {
		t.Fatal(err)
	}
	operation := protocol.PanelOperation{Status: protocol.Status{ID: strings.Repeat("c", 32), Busy: true}}
	if err := storage.Save(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	if service.cleanupKey() != "" {
		t.Fatal("cleanup overlaps an active deployment")
	}
	operation.Busy = false
	if err := storage.Save(install.Root, operation); err != nil {
		t.Fatal(err)
	}
	install.Write("images-maintained", expected)
	if service.cleanupKey() != "" {
		t.Fatal("already maintained images were scheduled again")
	}
}

func TestAutomaticCleanupStartsFromTheActiveImageAndStopsWithTheHelper(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux maintenance worker")
	}
	install := managed.New(t)
	t.Setenv("HY2_INSTALL_DIR", install.Root)
	install.Command("docker", `case "$3" in
inspect) exit 1 ;;
run) printf '%s\n' "$@" > "$HY2_INSTALL_DIR/cleanup-worker" ;;
esac`)
	service := &Service{Root: install.Root, Mu: &sync.Mutex{}, PortsBusy: func() bool { return false }}
	ctx, cancel := context.WithTimeout(t.Context(), cleanupInterval+3*time.Second)
	done := make(chan struct{})
	go func() { defer close(done); service.Maintain(ctx) }()
	defer func() { cancel(); <-done }()
	path := filepath.Join(install.Root, "cleanup-worker")
	for ctx.Err() == nil {
		if _, err := os.Stat(path); err == nil {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	data, err := os.ReadFile(path)
	if err != nil || !strings.Contains(string(data), "hy2-panel:"+install.Current) {
		t.Fatalf("cleanup worker not started from the active image: %s %v", data, err)
	}
	operation, err := storage.Read(install.Root)
	if err != nil || operation.Operation != "cleanup" || !operation.Busy {
		t.Fatalf("cleanup is not tracked: %+v %v", operation, err)
	}
}
