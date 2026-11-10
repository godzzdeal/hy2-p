package watchdog

import (
	"context"
	"fmt"
	"time"
)

func (monitor *Monitor) check(ctx context.Context, now time.Time) {
	version := monitor.runtime.Version()
	running := monitor.runtime.Running()
	// A planned stop during restart/update is not a crash. Recheck the process
	// under its operation lock before recording an unexpected exit.
	if !running {
		if !monitor.runtime.TryLock() {
			return
		}
		defer monitor.runtime.Unlock()
		running = monitor.runtime.Running()
	}
	monitor.mu.Lock()
	if version != monitor.version {
		monitor.version = version
		monitor.snapshot.Attempt = 0
		monitor.retryAt = time.Time{}
		monitor.stableSince = time.Time{}
		monitor.halted = false
	}
	if !monitor.snapshot.DesiredRunning || monitor.halted {
		monitor.mu.Unlock()
		return
	}
	if running {
		if monitor.stableSince.IsZero() {
			monitor.stableSince = now
		}
		if now.Sub(monitor.stableSince) >= monitor.policy.StableFor {
			monitor.snapshot.Attempt = 0
		}
		monitor.mu.Unlock()
		return
	}
	monitor.stableSince = time.Time{}
	if monitor.retryAt.IsZero() && monitor.snapshot.Attempt < len(monitor.policy.RetryDelays) {
		monitor.retryAt = now.Add(monitor.policy.RetryDelays[monitor.snapshot.Attempt])
		monitor.snapshot.NextRetry = monitor.retryAt.UTC().Format(time.RFC3339)
		monitor.snapshot.State = "backoff"
		monitor.snapshot.Message = fmt.Sprintf("Процесс завершился. Попытка перезапуска %d из %d", monitor.snapshot.Attempt+1, len(monitor.policy.RetryDelays))
		monitor.snapshot.LastCrash = now.UTC().Format(time.RFC3339)
		monitor.mu.Unlock()
		return
	}
	if now.Before(monitor.retryAt) {
		monitor.mu.Unlock()
		return
	}
	monitor.mu.Unlock()
	monitor.mu.Lock()
	wanted := monitor.snapshot.DesiredRunning
	monitor.mu.Unlock()
	if !wanted || monitor.runtime.Running() || ctx.Err() != nil {
		return
	}
	monitor.recover(ctx)
}
func (monitor *Monitor) recover(parent context.Context) {
	ctx, cancel := context.WithTimeout(parent, monitor.policy.Timeout)
	defer cancel()
	monitor.mu.Lock()
	monitor.cancel = cancel
	monitor.retryAt = time.Time{}
	monitor.snapshot.NextRetry = ""
	rollback := monitor.snapshot.Attempt >= len(monitor.policy.RetryDelays)
	if rollback {
		monitor.snapshot.State = "rolling_back"
		monitor.snapshot.Message = "Перезапуски не помогли. Откатываем версию"
	} else {
		monitor.snapshot.Attempt++
		monitor.snapshot.State = "restarting"
		monitor.snapshot.Message = fmt.Sprintf("Перезапуск %d из %d и проверка API", monitor.snapshot.Attempt, len(monitor.policy.RetryDelays))
	}
	monitor.mu.Unlock()
	var err error
	if rollback {
		err = monitor.runtime.Recover(ctx)
	} else {
		err = monitor.runtime.Restart(ctx)
	}
	monitor.mu.Lock()
	defer monitor.mu.Unlock()
	monitor.cancel = nil
	if !monitor.snapshot.DesiredRunning || parent.Err() != nil {
		return
	}
	if err != nil {
		monitor.snapshot.LastError = err.Error()
		if rollback {
			monitor.halted = true
			monitor.snapshot.State = "failed"
			monitor.snapshot.Message = "Восстановление не удалось. Проверьте конфигурацию и журнал."
		} else {
			monitor.snapshot.State = "backoff"
			monitor.snapshot.Message = "Перезапуск не помог. Будет следующая попытка или откат."
		}
		return
	}
	monitor.snapshot.State = "watching"
	monitor.snapshot.LastError = ""
	monitor.stableSince = time.Now()
	monitor.snapshot.Message = "Экземпляр перезапущен. Watchdog продолжает наблюдение."
	if rollback {
		monitor.snapshot.Attempt = 0
		monitor.version = monitor.runtime.Version()
		monitor.snapshot.Message = "Предыдущая версия восстановлена. Повторный откат на сбойную версию исключён."
	}
}
