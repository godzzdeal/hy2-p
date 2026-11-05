package records

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
)

var writeMu sync.Mutex

func latest(directory, kind string) (string, uint64, error) {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return "", 0, err
	}
	var revision uint64
	var path string
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), kind+"-") || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		number, err := strconv.ParseUint(strings.TrimSuffix(strings.TrimPrefix(entry.Name(), kind+"-"), ".json"), 10, 64)
		if err == nil && number > revision {
			revision = number
			path = filepath.Join(directory, entry.Name())
		}
	}
	if path == "" {
		return "", 0, os.ErrNotExist
	}
	return path, revision, nil
}
func Read(directory, kind string, target any) error {
	path, _, err := latest(directory, kind)
	if err != nil {
		return err
	}
	payload, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(payload, target)
}
func Write(directory, kind string, value any) error {
	writeMu.Lock()
	defer writeMu.Unlock()
	if err := os.MkdirAll(directory, 0700); err != nil {
		return err
	}
	_, revision, err := latest(directory, kind)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	payload, err := json.Marshal(value)
	if err != nil {
		return err
	}
	temporary, err := os.CreateTemp(directory, "pending-")
	if err != nil {
		return err
	}
	defer os.Remove(temporary.Name())
	defer temporary.Close()
	if err = temporary.Chmod(0600); err != nil {
		return err
	}
	if _, err = temporary.Write(payload); err != nil {
		return err
	}
	if err = temporary.Sync(); err != nil {
		return err
	}
	if err = temporary.Close(); err != nil {
		return err
	}
	if err = os.Rename(temporary.Name(), filepath.Join(directory, fmt.Sprintf("%s-%020d.json", kind, revision+1))); err != nil {
		return err
	}
	prune(directory, kind)
	return nil
}

const RetainedRecords = 16

func prune(directory, kind string) {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return
	}
	names := []string{}
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), kind+"-") && strings.HasSuffix(entry.Name(), ".json") {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)
	if len(names) <= RetainedRecords {
		return
	}
	for _, name := range names[:len(names)-RetainedRecords] {
		os.Remove(filepath.Join(directory, name))
	}
}
