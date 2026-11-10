package managed

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type Installation struct {
	Root, Current, Previous string
	t                       *testing.T
}

func New(t *testing.T) *Installation {
	t.Helper()
	value := &Installation{Root: t.TempDir(), Current: strings.Repeat("a", 40), Previous: strings.Repeat("b", 40), t: t}
	value.Write("current", value.Current)
	value.Write("previous", value.Previous)
	value.Write("releases/"+value.Current+"/internal/buildinfo/VERSION", "v0.7.5")
	value.Write("releases/"+value.Previous+"/internal/buildinfo/VERSION", "v0.7.4")
	value.Write("rollback-backup", filepath.Join(value.Root, "backups", "fixture"))
	for _, file := range []string{"data.tar.gz", "certs.tar.gz", "environment"} {
		value.Write("backups/fixture/"+file, "test fixture")
	}
	value.Write("backups/fixture/manifest.json", `{"format":1,"commit":"`+value.Previous+`","created":"2026-11-10T09:00:00Z"}`)
	return value
}
func (value *Installation) Write(name, body string) {
	value.t.Helper()
	path := filepath.Join(value.Root, filepath.FromSlash(name))
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		value.t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0600); err != nil {
		value.t.Fatal(err)
	}
}
func (value *Installation) Command(name, body string) {
	value.t.Helper()
	directory := filepath.Join(value.Root, "test-bin")
	value.Write("test-bin/"+name, "#!/bin/sh\n"+body+"\n")
	if err := os.Chmod(filepath.Join(directory, name), 0700); err != nil {
		value.t.Fatal(err)
	}
	value.t.Setenv("PATH", directory+string(os.PathListSeparator)+os.Getenv("PATH"))
}
