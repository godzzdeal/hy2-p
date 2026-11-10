package storage

import (
	"encoding/json"
	"hy2-panel/internal/portcontrol/history"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
)

func Read(root string) (protocol.PanelOperation, error) {
	var result protocol.PanelOperation
	err := records.Read(filepath.Join(root, "panel-maintenance"), "operation", &result)
	if os.IsNotExist(err) {
		result.Phase = "idle"
		return result, nil
	}
	return result, err
}
func Save(root string, value protocol.PanelOperation) error {
	if err := records.Write(filepath.Join(root, "panel-maintenance"), "operation", value); err != nil {
		return err
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	directory := filepath.Join(root, "udp-history")
	if err = os.MkdirAll(directory, 0700); err != nil {
		return err
	}
	// Keep progress readable after rolling back to panels with the original ticket endpoint.
	if err = history.Atomic(filepath.Join(directory, value.ID+".json"), data); err != nil {
		return err
	}
	history.Prune(directory)
	return nil
}
