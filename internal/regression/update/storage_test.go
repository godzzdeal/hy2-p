package update_test

import (
	"context"
	"errors"
	"fmt"
	"hy2-panel/internal/core/update"
	"hy2-panel/internal/records"
	"hy2-panel/internal/releases"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type testSource struct{ failDownload bool }

func (source *testSource) List(context.Context) ([]releases.Version, error) {
	return []releases.Version{{Tag: "app/v2.13.0", Available: true}}, nil
}
func (source *testSource) Resolve(context.Context, string) (releases.Asset, error) {
	return releases.Asset{}, nil
}
func (source *testSource) Download(context.Context, releases.Asset, string) (string, error) {
	if source.failDownload {
		return "", errors.New("checksum mismatch")
	}
	return "candidate", nil
}

func TestCorruptLatestDoesNotFallBackToLegacy(t *testing.T) {
	directory := t.TempDir()
	storage := filepath.Join(directory, "core")
	if err := os.MkdirAll(storage, 0700); err != nil {
		t.Fatal(err)
	}
	writeState(t, filepath.Join(storage, "state.json"), update.State{Current: update.Entry{Path: "original", Version: "app/v2.12.3"}})
	if err := os.WriteFile(filepath.Join(storage, fmt.Sprintf("state-%020d.json", 2)), []byte("{broken"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := update.New(directory, "unused-bundle", &testRuntime{}, &testSource{}); err == nil {
		t.Fatal("corrupt confirmed revision was replaced by stale legacy state")
	}
}

func TestLegacyStateSurvivesFirstUpdateAndReload(t *testing.T) {
	directory := t.TempDir()
	storage := filepath.Join(directory, "core")
	if err := os.MkdirAll(storage, 0700); err != nil {
		t.Fatal(err)
	}
	legacy := filepath.Join(storage, "state.json")
	writeState(t, legacy, update.State{Current: update.Entry{Path: "original", Version: "app/v2.12.3"}})
	runtime := &testRuntime{}
	service, err := update.New(directory, "unused-bundle", runtime, &testSource{})
	if err != nil {
		t.Fatal(err)
	}
	if service.Current().Path != "original" || service.Current().Version != "app/v2.12.3" {
		t.Fatal("legacy version selection lost", service.Current())
	}
	if err := service.Begin("app/v2.13.0", false); err != nil {
		t.Fatal(err)
	}
	wait(t, service)
	restored, err := update.New(directory, "unused-bundle", runtime, &testSource{})
	if err != nil {
		t.Fatal(err)
	}
	if restored.Current().Version != "app/v2.13.0" || restored.Snapshot().Previous != "app/v2.12.3" {
		t.Fatal("revision did not supersede legacy state", restored.Snapshot())
	}
}

func TestLatestJournalWinsAndInterruptedTrialIsDiscarded(t *testing.T) {
	directory := t.TempDir()
	storage := filepath.Join(directory, "core")
	if err := os.MkdirAll(storage, 0700); err != nil {
		t.Fatal(err)
	}
	old := update.State{Current: update.Entry{Path: "original", Version: "app/v2.12.3"}}
	writeState(t, filepath.Join(storage, "state.json"), old)
	writeState(t, filepath.Join(storage, fmt.Sprintf("state-%020d.json", 9)), old)
	confirmed := update.State{Current: update.Entry{Path: "candidate", Version: "app/v2.13.0"}, Previous: &old.Current,
		Pending: &update.Entry{Path: "unverified", Version: "app/v2.99.0"}}
	writeState(t, filepath.Join(storage, fmt.Sprintf("state-%020d.json", 10)), confirmed)
	if err := os.WriteFile(filepath.Join(storage, "pending-interrupted"), []byte("{incomplete"), 0600); err != nil {
		t.Fatal(err)
	}
	runtime := &testRuntime{}
	for range 2 {
		service, err := update.New(directory, "unused-bundle", runtime, &testSource{})
		if err != nil {
			t.Fatal(err)
		}
		if service.Current() != confirmed.Current || service.Snapshot().Previous != old.Current.Version || service.Snapshot().Result.Phase != "rolled_back" || len(runtime.calls) != 0 {
			t.Fatal("unconfirmed trial selected or recovery was not persisted", service.Snapshot())
		}
	}
	var saved update.State
	if err := records.Read(storage, "state", &saved); err != nil || saved.Pending != nil {
		t.Fatal("pending trial retained", err)
	}
}

func TestUpdateJournalRetentionPreservesVersionSelection(t *testing.T) {
	directory := t.TempDir()
	runtime := &testRuntime{}
	service, err := update.New(directory, "original", runtime, &testSource{})
	if err != nil {
		t.Fatal(err)
	}
	for index := range records.RetainedRecords + 2 {
		rollback := index%2 != 0
		if err := service.Begin("app/v2.13.0", rollback); err != nil {
			t.Fatal(err)
		}
		if status := wait(t, service); status.Result.Phase != "success" {
			t.Fatal(status)
		}
	}
	entries, err := os.ReadDir(filepath.Join(directory, "core"))
	if err != nil {
		t.Fatal(err)
	}
	count := 0
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), "state-") {
			count++
		}
	}
	if count != records.RetainedRecords {
		t.Fatalf("journal retains %d revisions, want %d", count, records.RetainedRecords)
	}
	restored, err := update.New(directory, "unused-bundle", runtime, &testSource{})
	if err != nil || restored.Current() != service.Current() || restored.Snapshot().Previous != service.Snapshot().Previous {
		t.Fatal("pruning changed confirmed or rollback selection", err)
	}
}
