package update_test

import (
	"context"
	"errors"
	"sync"
	"testing"
)

type testRuntime struct {
	lock           sync.Mutex
	isRunning      bool
	path           string
	failPath       string
	failRestore    bool
	failAfterStart bool
	cancelFailure  context.CancelFunc
	calls          []string
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
func (runtime *testRuntime) Activate(ctx context.Context, path string, run bool) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	runtime.calls = append(runtime.calls, path)
	if path == runtime.failPath || (path == "original" && runtime.failRestore) {
		if runtime.failAfterStart {
			runtime.path, runtime.isRunning = path, run
			if runtime.cancelFailure != nil {
				runtime.cancelFailure()
			}
		}
		return errors.New("health check failed")
	}
	runtime.path = path
	runtime.isRunning = run
	return nil
}

func TestFailedWatchdogRecoveryStopsCandidateAfterCancellation(t *testing.T) {
	runtime := &testRuntime{isRunning: true, path: "original"}
	service := newService(t, runtime, &testSource{})
	if err := service.Begin("app/v2.13.0", false); err != nil {
		t.Fatal(err)
	}
	wait(t, service)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	runtime.failPath, runtime.failAfterStart, runtime.cancelFailure = "original", true, cancel
	runtime.lock.Lock()
	err := service.RecoverLocked(ctx)
	runtime.lock.Unlock()
	if err == nil || ctx.Err() == nil {
		t.Fatal("fixture did not reproduce a cancelled health failure")
	}
	status := service.Snapshot()
	if runtime.isRunning || runtime.path != "candidate" || status.Current != "app/v2.13.0" || status.Result.Phase != "failed" || !status.RollbackAvailable {
		t.Fatalf("candidate leaked or recorded state changed: %+v, path=%s running=%v", status, runtime.path, runtime.isRunning)
	}
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
