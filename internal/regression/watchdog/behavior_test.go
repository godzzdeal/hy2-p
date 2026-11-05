package watchdog_test

import (
	"context"
	"hy2-panel/internal/core/watchdog"
	"testing"
	"time"
)

const testInterval = time.Millisecond

func monitor(t *testing.T, runtime *testRuntime) *watchdog.Monitor {
	t.Helper()
	monitor := watchdog.New(runtime, watchdog.Policy{Interval: testInterval, Timeout: time.Second, StableFor: time.Hour, RetryDelays: []time.Duration{testInterval, testInterval}})
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	go monitor.Run(ctx)
	return monitor
}
func waitFor(t *testing.T, condition func() bool) {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(testInterval)
	}
	t.Fatal("watchdog condition timed out")
}
func TestRestartAfterUnexpectedExit(t *testing.T) {
	runtime := &testRuntime{version: "new"}
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	waitFor(t, func() bool { return runtime.Running() })
	restarts, rollbacks := runtime.counts()
	if restarts != 1 || rollbacks != 0 {
		t.Fatalf("%d %d", restarts, rollbacks)
	}
}
func TestExhaustedRestartsRollback(t *testing.T) {
	runtime := &testRuntime{version: "new", restartFails: true}
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	waitFor(t, func() bool { return runtime.Running() })
	restarts, rollbacks := runtime.counts()
	if restarts != 2 || rollbacks != 1 {
		t.Fatalf("%d %d", restarts, rollbacks)
	}
}
func TestCrashLoopCountsSuccessfulShortRestarts(t *testing.T) {
	runtime := &testRuntime{version: "new"}
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	waitFor(t, runtime.Running)
	runtime.crash()
	watch.NotifyExit()
	waitFor(t, func() bool { count, _ := runtime.counts(); return count == 2 && runtime.Running() })
	runtime.crash()
	watch.NotifyExit()
	waitFor(t, func() bool { _, count := runtime.counts(); return count == 1 })
}
func TestManualStopStaysStopped(t *testing.T) {
	runtime := &testRuntime{version: "new"}
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	waitFor(t, runtime.Running)
	watch.SetDesired(false)
	runtime.crash()
	watch.NotifyExit()
	time.Sleep(15 * testInterval)
	restarts, _ := runtime.counts()
	if restarts != 1 || runtime.Running() {
		t.Fatal("manual stop was undone")
	}
}
func TestRollbackFailureStopsRetryLoop(t *testing.T) {
	runtime := &testRuntime{version: "new", restartFails: true, rollbackFails: true}
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	waitFor(t, func() bool { return watch.Snapshot().State == "failed" })
	time.Sleep(15 * testInterval)
	restarts, rollbacks := runtime.counts()
	if restarts != 2 || rollbacks != 1 {
		t.Fatal("unbounded recovery loop")
	}
}
func TestPlannedOperationDefersRecovery(t *testing.T) {
	runtime := &testRuntime{version: "new"}
	runtime.operation.Lock()
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	time.Sleep(15 * testInterval)
	count, _ := runtime.counts()
	if count != 0 {
		t.Fatal("interfered with planned operation")
	}
	runtime.operation.Unlock()
	waitFor(t, runtime.Running)
}
