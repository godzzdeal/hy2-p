package systemmetrics

import (
	"context"
	"hy2-panel/internal/systemmetrics/disk"
	"time"
)

func (service *Service) storageLoop(ctx context.Context) {
	for {
		scanCtx, cancel := context.WithTimeout(ctx, ScanTimeout)
		result := disk.Scan(scanCtx, disk.Options{Data: service.options.Data, Root: service.options.Root})
		cancel()
		service.mu.Lock()
		service.snapshot.Storage = result
		service.mu.Unlock()
		timer := time.NewTimer(StorageInterval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}
