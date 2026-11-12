package aclfiles_test

import (
	"hy2-panel/internal/aclfiles"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestFilesAreBoundedAndStoredByContentInsideTheInstance(t *testing.T) {
	data := t.TempDir()
	payload := "reject(all, udp/443)\ndirect(all)\n"
	path, err := aclfiles.Store(data, "file", strings.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	read, err := os.ReadFile(path)
	if err != nil || string(read) != payload {
		t.Fatalf("file: %s %v", read, err)
	}
	again, err := aclfiles.Store(data, "file", strings.NewReader(payload))
	if err != nil || again != path {
		t.Fatalf("dedup: %s %v", again, err)
	}
	for _, invalid := range []string{"", strings.Repeat("x", int(aclfiles.MaxRules)+1), "bad\x00data", string([]byte{0xff})} {
		if _, err := aclfiles.Store(data, "file", strings.NewReader(invalid)); err == nil {
			t.Fatal("invalid rules accepted")
		}
	}
	if _, err := aclfiles.Store(data, "../outside", strings.NewReader(payload)); err == nil {
		t.Fatal("invalid kind accepted")
	}
	entries, _ := os.ReadDir(filepath.Join(data, aclfiles.Directory))
	if len(entries) != 1 {
		t.Fatalf("temporary files leaked: %v", entries)
	}
}

func TestUploadCannotFollowAnACLDirectorySymlink(t *testing.T) {
	data := t.TempDir()
	external := t.TempDir()
	if err := os.Symlink(external, filepath.Join(data, aclfiles.Directory)); err != nil {
		t.Skip("symlinks unavailable")
	}
	if _, err := aclfiles.Store(data, "file", strings.NewReader("direct(all)")); err == nil {
		t.Fatal("symlink followed")
	}
	entries, _ := os.ReadDir(external)
	if len(entries) != 0 {
		t.Fatal("external directory changed")
	}
}

func TestDatabaseLargerThan64MBIsStoredWithoutTruncation(t *testing.T) {
	const databaseSize = 85 << 20
	source, err := os.CreateTemp(t.TempDir(), "geosite-*.dat")
	if err != nil {
		t.Fatal(err)
	}
	defer source.Close()
	if err := source.Truncate(databaseSize); err != nil {
		t.Fatal(err)
	}
	path, err := aclfiles.Store(t.TempDir(), "geosite", source)
	if err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(path)
	if err != nil || info.Size() != databaseSize {
		t.Fatalf("database was not stored completely: %v %v", info, err)
	}
}
