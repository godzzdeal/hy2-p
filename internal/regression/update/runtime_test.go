package update_test

import (
	"context"
	"errors"
	"sync"
	"testing"
)

type testRuntime struct {
	lock        sync.Mutex
	isRunning   bool
	path        string
	failPath    string
	failRestore bool
	calls       []string
}

func (runtime *testRuntime) TryLock() bool { return runtime.lock.TryLock() }
func (runtime *testRuntime) Unlock()       { runtime.lock.Unlock() }
func (runtime *testRuntime) Running() bool { return runtime.isRunning }
func (runtime *testRuntime) Probe(_ context.Context, path string) (string, error) {
	if path == "candidate" {
		return "app/v2.13.0", nil
	}
	return "app/v2.12.3", nil
}
func (runtime *testRuntime) Activate(_ context.Context, path string, run bool) error {
	runtime.calls = append(runtime.calls, path)
	if path == runtime.failPath || (path == "original" && runtime.failRestore) {
		return errors.New("health check failed")
	}
	runtime.path = path
	runtime.isRunning = run
	return nil
}

func TestWatchdogRecoveryDoesNotReuseBrokenVersion(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original"}
	service := newService(t, runtime, &testSource{})
	if err := service.Begin("app/v2.13.0", false); err != nil {
		t.Fatal(err)
	}
	wait(t, service)
	runtime.lock.Lock()
	err := service.RecoverLocked(context.Background())
	runtime.lock.Unlock()
	if err != nil {
		t.Fatal(err)
	}
	status := service.Snapshot()
	if status.Current != "app/v2.12.3" || status.RollbackAvailable || runtime.path != "original" {
		t.Fatalf("%+v", status)
	}
	runtime.lock.Lock()
	err = service.RecoverLocked(context.Background())
	runtime.lock.Unlock()
	if err == nil {
		t.Fatal("broken version reused for automatic rollback")
	}
}
