package systemmetrics_test

import (
	"context"
	"hy2-panel/internal/systemmetrics/disk"
	"os"
	"path/filepath"
	"testing"
)

func TestStorageIncludesDataBackupsAndReleasesWithoutDoubleCounting(t *testing.T) {
	root := t.TempDir()
	write(t, root, "data/config", "12345")
	write(t, root, "backups/test.tar", "1234567")
	write(t, root, "releases/test/code", "123")
	write(t, root, "current", "1")
	result := disk.Scan(t.Context(), disk.Options{Root: root, Data: filepath.Join(root, "data")})
	if result.Data != 5 || result.Backups != 7 || result.Releases != 3 || result.Other != 1 || !result.Managed {
		t.Fatalf("wrong categories: %+v", result)
	}
}
func TestStorageDoesNotFollowSymlinksAndHonorsCancellation(t *testing.T) {
	root := t.TempDir()
	outside := t.TempDir()
	write(t, outside, "secret", "do not traverse")
	if err := os.Symlink(outside, filepath.Join(root, "link")); err != nil {
		t.Skip("symlinks unavailable")
	}
	result := disk.Scan(t.Context(), disk.Options{Data: root})
	if result.Data != 0 || !result.Complete {
		t.Fatalf("followed symlink: %+v", result)
	}
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	result = disk.Scan(ctx, disk.Options{Data: root})
	if result.Complete || result.Message == "" {
		t.Fatalf("cancelled scan marked complete: %+v", result)
	}
}
