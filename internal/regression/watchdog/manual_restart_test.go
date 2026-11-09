package watchdog_test

import (
	"testing"
	"time"
)

func TestPlannedRestartDoesNotRecordACrash(t *testing.T) {
	runtime := &testRuntime{version: "current", running: true}
	runtime.operation.Lock()
	watch := monitor(t, runtime)
	watch.SetDesired(true)
	runtime.crash()
	watch.NotifyExit()
	time.Sleep(15 * testInterval)
	if state := watch.Snapshot(); state.LastCrash != "" || state.Attempt != 0 {
		t.Fatal("planned stop recorded as crash", state)
	}
	runtime.mu.Lock()
	runtime.running = true
	runtime.mu.Unlock()
	runtime.operation.Unlock()
	time.Sleep(10 * testInterval)
	if state := watch.Snapshot(); state.LastCrash != "" {
		t.Fatal("planned restart generated a crash notification", state)
	}
}
