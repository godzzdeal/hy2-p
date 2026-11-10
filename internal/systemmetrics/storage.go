package systemmetrics

import (
	"context"
	"hy2-panel/internal/systemmetrics/disk"
	"hy2-panel/internal/transport"
	"net/http"
	"time"
)

func (service *Service) RefreshStorage(writer http.ResponseWriter, request *http.Request) {
	service.refreshStorage(request.Context())
	transport.Respond(writer, true)
}

func (service *Service) storageLoop(ctx context.Context) {
	for {
		service.refreshStorage(ctx)
		timer := time.NewTimer(StorageInterval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}

func (service *Service) refreshStorage(ctx context.Context) {
	service.storageMu.Lock()
	defer service.storageMu.Unlock()
	if ctx.Err() != nil {
		return
	}
	scanCtx, cancel := context.WithTimeout(ctx, ScanTimeout)
	defer cancel()
	result := disk.Scan(scanCtx, disk.Options{Data: service.options.Data, Root: service.options.Root})
	service.mu.Lock()
	service.snapshot.Storage = result
	service.mu.Unlock()
}
