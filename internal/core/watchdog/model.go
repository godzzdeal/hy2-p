package watchdog

import (
	"context"
	"sync"
	"time"
)

const CheckInterval = time.Second
const RestartTimeout = 15 * time.Second
const StableWindow = 5 * time.Minute

type Policy struct {
	Interval, Timeout, StableFor time.Duration
	RetryDelays                  []time.Duration
}

func DefaultPolicy() Policy {
	return Policy{CheckInterval, RestartTimeout, StableWindow, []time.Duration{time.Second, 3 * time.Second}}
}

type Snapshot struct {
	DesiredRunning bool   `json:"desiredRunning"`
	State          string `json:"state"`
	Attempt        int    `json:"attempt"`
	MaxAttempts    int    `json:"maxAttempts"`
	Message        string `json:"message"`
	LastCrash      string `json:"lastCrash"`
	LastError      string `json:"lastError"`
	NextRetry      string `json:"nextRetry"`
}
type Runtime interface {
	TryLock() bool
	Unlock()
	Running() bool
	Version() string
	Restart(context.Context) error
	Recover(context.Context) error
}
type Monitor struct {
	mu                   sync.Mutex
	runtime              Runtime
	policy               Policy
	snapshot             Snapshot
	wake                 chan struct{}
	cancel               context.CancelFunc
	version              string
	retryAt, stableSince time.Time
	halted               bool
}

func New(runtime Runtime, policy Policy) *Monitor {
	return &Monitor{runtime: runtime, policy: policy, wake: make(chan struct{}, 1), snapshot: Snapshot{State: "idle", Message: "Ядро остановлено вручную", MaxAttempts: len(policy.RetryDelays)}}
}
func (monitor *Monitor) Snapshot() Snapshot {
	monitor.mu.Lock()
	defer monitor.mu.Unlock()
	return monitor.snapshot
}
func (monitor *Monitor) SetDesired(wanted bool) {
	monitor.mu.Lock()
	monitor.snapshot.DesiredRunning = wanted
	monitor.snapshot.Attempt = 0
	monitor.retryAt = time.Time{}
	monitor.stableSince = time.Time{}
	monitor.halted = false
	if wanted {
		monitor.snapshot.State = "watching"
		monitor.snapshot.Message = "Watchdog следит за процессом"
	} else {
		monitor.snapshot.State = "idle"
		monitor.snapshot.Message = "Автовосстановление выключено: ядро остановлено вручную"
	}
	monitor.snapshot.NextRetry = ""
	if monitor.cancel != nil {
		monitor.cancel()
	}
	monitor.mu.Unlock()
	monitor.NotifyExit()
}
func (monitor *Monitor) NotifyExit() {
	select {
	case monitor.wake <- struct{}{}:
	default:
	}
}
func (monitor *Monitor) Run(ctx context.Context) {
	ticker := time.NewTicker(monitor.policy.Interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-monitor.wake:
		}
		monitor.check(ctx, time.Now())
	}
}
