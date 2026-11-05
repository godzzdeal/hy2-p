package watchdog_test

import (
	"context"
	"errors"
	"sync"
)

type testRuntime struct {
	operation                   sync.Mutex
	mu                          sync.Mutex
	running                     bool
	version                     string
	restarts, rollbacks         int
	restartFails, rollbackFails bool
}

func (runtime *testRuntime) TryLock() bool { return runtime.operation.TryLock() }
func (runtime *testRuntime) Unlock()       { runtime.operation.Unlock() }
func (runtime *testRuntime) Running() bool {
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	return runtime.running
}
func (runtime *testRuntime) Version() string {
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	return runtime.version
}
func (runtime *testRuntime) Restart(context.Context) error {
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	runtime.restarts++
	if runtime.restartFails {
		return errors.New("restart failed")
	}
	runtime.running = true
	return nil
}
func (runtime *testRuntime) Recover(context.Context) error {
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	runtime.rollbacks++
	if runtime.rollbackFails {
		return errors.New("rollback failed")
	}
	runtime.running = true
	runtime.version = "previous"
	return nil
}
func (runtime *testRuntime) crash() { runtime.mu.Lock(); runtime.running = false; runtime.mu.Unlock() }
func (runtime *testRuntime) counts() (int, int) {
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	return runtime.restarts, runtime.rollbacks
}
