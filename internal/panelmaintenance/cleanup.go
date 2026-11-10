package panelmaintenance

import (
	"context"
	"hy2-panel/internal/panelmaintenance/job"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const cleanupInterval = 10 * time.Second

// Maintain starts cleanup from the active image after the update worker has exited.
// This lets Docker release the old image instead of keeping it pinned by that worker.
func (service *Service) Maintain(ctx context.Context) {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()
	lastAttempt := ""
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			job.PruneCompleted(service.Root)
			key := service.cleanupKey()
			if key == "" || key == lastAttempt {
				continue
			}
			operation, err := service.reserve(protocol.PanelRequest{Action: "cleanup"})
			if err != nil {
				continue
			}
			lastAttempt = key
			service.launch(operation)
		}
	}
}

func (service *Service) cleanupKey() string {
	for _, name := range []string{"update.pending", "udp.pending"} {
		if _, err := os.Stat(filepath.Join(service.Root, name)); !os.IsNotExist(err) {
			return ""
		}
	}
	current, err := storage.Commit(service.Root)
	if err != nil {
		return ""
	}
	previous, _ := os.ReadFile(filepath.Join(service.Root, "previous"))
	backup, _ := os.ReadFile(filepath.Join(service.Root, "rollback-backup"))
	key := current + ":" + strings.TrimSpace(string(previous)) + ":" + strings.TrimSpace(string(backup))
	marker, err := os.ReadFile(filepath.Join(service.Root, "images-maintained"))
	if err == nil && strings.TrimSpace(string(marker)) == key {
		return ""
	}
	if err != nil && !os.IsNotExist(err) {
		log.Printf("read image cleanup marker: %v", err)
		return ""
	}
	operation, err := storage.Read(service.Root)
	if err != nil || operation.Busy || job.Running(operation.ID) {
		return ""
	}
	return key
}
