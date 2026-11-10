package storage

import (
	"encoding/json"
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"os"
	"path/filepath"
	"strings"
)

func Commit(root string) (string, error) {
	data, err := os.ReadFile(filepath.Join(root, "current"))
	value := strings.TrimSpace(string(data))
	if err == nil && !commands.ValidCommit(value) {
		err = os.ErrInvalid
	}
	return value, err
}
func Version(root, commit string) string {
	if !commands.ValidCommit(commit) {
		return ""
	}
	data, err := os.ReadFile(filepath.Join(root, "releases", commit, "internal/buildinfo/VERSION"))
	value := strings.TrimSpace(string(data))
	if err != nil || !protocol.PanelVersionPattern.MatchString(value) {
		return ""
	}
	return value
}
func Installation(root string) (protocol.PanelInstallation, error) {
	operation, err := Read(root)
	if err != nil {
		return protocol.PanelInstallation{}, err
	}
	current, err := Commit(root)
	if err != nil {
		return protocol.PanelInstallation{}, err
	}
	result := protocol.PanelInstallation{Available: true, Current: Version(root, current), Operation: operation}
	previous, _ := os.ReadFile(filepath.Join(root, "previous"))
	result.Previous = Version(root, strings.TrimSpace(string(previous)))
	backup, _ := os.ReadFile(filepath.Join(root, "rollback-backup"))
	directory := strings.TrimSpace(string(backup))
	relative, err := filepath.Rel(filepath.Join(root, "backups"), directory)
	if err != nil || relative == "." || strings.HasPrefix(relative, "..") || result.Previous == "" {
		return result, nil
	}
	for _, name := range []string{"data.tar.gz", "certs.tar.gz", "environment", "manifest.json"} {
		if info, err := os.Stat(filepath.Join(directory, name)); err != nil || !info.Mode().IsRegular() {
			return result, nil
		}
	}
	var manifest struct {
		Created string `json:"created"`
		Commit  string `json:"commit"`
		Format  int    `json:"format"`
	}
	data, err := os.ReadFile(filepath.Join(directory, "manifest.json"))
	if err == nil && json.Unmarshal(data, &manifest) == nil && manifest.Format == 1 && manifest.Commit == strings.TrimSpace(string(previous)) {
		result.BackupCreated = manifest.Created
		result.RollbackAvailable = true
	}
	return result, nil
}
