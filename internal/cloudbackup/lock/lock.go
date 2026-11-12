package lock

import (
	"errors"
	"os"
	"path/filepath"
)

// Share the installer's deployment lock so a manual CLI backup cannot race
// with credentials or folder changes submitted through the web interface.
func Acquire(root string) (func(), error) {
	file, err := os.OpenFile(filepath.Join(root, ".deployment.lock"), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	if err = tryLock(file); err != nil {
		file.Close()
		return nil, errors.New("Дождитесь завершения обслуживания панели")
	}
	return func() { file.Close() }, nil
}
