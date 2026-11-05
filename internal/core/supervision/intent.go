package supervision

import (
	"hy2-panel/internal/records"
	"os"
	"path/filepath"
)

type Intent struct {
	Running bool `json:"running"`
}

func ReadIntent(data string) (bool, error) {
	var intent Intent
	err := records.Read(filepath.Join(data, "core"), "intent", &intent)
	if os.IsNotExist(err) {
		return false, nil
	}
	return intent.Running, err
}
func SaveIntent(data string, running bool) error {
	return records.Write(filepath.Join(data, "core"), "intent", Intent{Running: running})
}
