package history

import (
	"os"
	"path/filepath"
	"sort"
)

func Atomic(path string, data []byte) error {
	temporary, err := os.CreateTemp(filepath.Dir(path), ".udp-operation-")
	if err != nil {
		return err
	}
	defer os.Remove(temporary.Name())
	if _, err = temporary.Write(data); err == nil {
		err = temporary.Sync()
	}
	closeError := temporary.Close()
	if err != nil {
		return err
	}
	if closeError != nil {
		return closeError
	}
	return os.Rename(temporary.Name(), path)
}

const retainedOperations = 64

func Prune(directory string) {
	entries, err := os.ReadDir(directory)
	if err != nil || len(entries) <= retainedOperations {
		return
	}
	sort.Slice(entries, func(first, second int) bool {
		left, leftErr := entries[first].Info()
		right, rightErr := entries[second].Info()
		return leftErr == nil && (rightErr != nil || left.ModTime().Before(right.ModTime()))
	})
	for _, entry := range entries[:len(entries)-retainedOperations] {
		os.Remove(filepath.Join(directory, entry.Name()))
	}
}
