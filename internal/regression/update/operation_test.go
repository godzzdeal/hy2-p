package update_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/core/update"
	"os"
	"path/filepath"
	"testing"
	"time"
)

const completionDeadline = time.Second * 3
const completionPoll = time.Millisecond

func wait(t *testing.T, service *update.Service) update.Status {
	t.Helper()
	deadline := time.Now().Add(completionDeadline)
	for time.Now().Before(deadline) {
		status := service.Snapshot()
		if !status.Busy {
			return status
		}
		time.Sleep(completionPoll)
	}
	t.Fatal("operation did not complete")
	return update.Status{}
}
func newService(t *testing.T, runtime *testRuntime, source *testSource) *update.Service {
	t.Helper()
	service, err := update.New(t.TempDir(), "original", runtime, source)
	if err != nil {
		t.Fatal(err)
	}
	return service
}
func TestSuccessfulUpdateAndManualRollback(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original"}
	service := newService(t, runtime, &testSource{})
	if err := service.Begin("app/v2.13.0", false); err != nil {
		t.Fatal(err)
	}
	status := wait(t, service)
	if status.Current != "app/v2.13.0" || status.Result.Phase != "success" || !status.RollbackAvailable {
		t.Fatalf("%+v", status)
	}
	if err := service.Begin("", true); err != nil {
		t.Fatal(err)
	}
	status = wait(t, service)
	if status.Current != "app/v2.12.3" || runtime.path != "original" || !runtime.isRunning {
		t.Fatalf("%+v", status)
	}
}
func TestHealthFailureRestoresRunningCore(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original", failPath: "candidate"}
	service := newService(t, runtime, &testSource{})
	service.Begin("app/v2.13.0", false)
	status := wait(t, service)
	if status.Result.Phase != "rolled_back" || runtime.path != "original" || !runtime.isRunning || status.Current != "app/v2.12.3" {
		t.Fatalf("%+v", status)
	}
}
func TestRejectedDownloadDoesNotTouchProcess(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original"}
	service := newService(t, runtime, &testSource{failDownload: true})
	service.Begin("app/v2.13.0", false)
	status := wait(t, service)
	if status.Result.Phase != "failed" || len(runtime.calls) != 0 || !runtime.isRunning {
		t.Fatalf("%+v", status)
	}
}
func TestStoppedCoreStaysStoppedAfterTrial(t *testing.T) {
	runtime := &testRuntime{path: "original"}
	service := newService(t, runtime, &testSource{})
	service.Begin("app/v2.13.0", false)
	status := wait(t, service)
	if status.Result.Phase != "success" || runtime.isRunning || len(runtime.calls) != 2 {
		t.Fatalf("%+v", status)
	}
}
func TestInterruptedUpdateChoosesConfirmedVersion(t *testing.T) {
	directory := t.TempDir()
	os.MkdirAll(filepath.Join(directory, "core"), 0700)
	state := update.State{Current: update.Entry{Path: "original", Version: "app/v2.12.3"}, Pending: &update.Entry{Path: "candidate", Version: "app/v2.13.0"}}
	payload, _ := json.Marshal(state)
	os.WriteFile(filepath.Join(directory, "core", "state.json"), payload, 0600)
	runtime := &testRuntime{}
	service, err := update.New(directory, "original", runtime, &testSource{})
	if err != nil {
		t.Fatal(err)
	}
	if service.Current().Path != "original" || service.Snapshot().Result.Phase != "rolled_back" {
		t.Fatal(service.Snapshot())
	}
}
func TestExclusiveOperationsAndMissingRollback(t *testing.T) {
	runtime := &testRuntime{}
	service := newService(t, runtime, &testSource{})
	if err := service.Begin("", true); err == nil {
		t.Fatal("missing rollback accepted")
	}
	runtime.lock.Lock()
	if err := service.Begin("app/v2.13.0", false); err == nil {
		t.Fatal("concurrent operation accepted")
	}
	runtime.lock.Unlock()
	if err := service.Begin("../../malicious", false); err == nil {
		t.Fatal("invalid version accepted")
	}
	_, err := runtime.Probe(context.Background(), "original")
	if err != nil {
		t.Fatal(err)
	}
}
func TestRollbackFailureIsReported(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original", failPath: "candidate", failRestore: true}
	service := newService(t, runtime, &testSource{})
	service.Begin("app/v2.13.0", false)
	status := wait(t, service)
	if status.Result.Phase != "failed" {
		t.Fatalf("%+v", status)
	}
}
