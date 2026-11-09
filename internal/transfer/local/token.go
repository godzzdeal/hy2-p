package local

import (
	"hy2-panel/internal/security"
	"os"
	"path/filepath"
)

const TokenFile = "transfer.token"

func Path(data string) string { return filepath.Join(data, "secrets", TokenFile) }
func createToken(data string) (string, error) {
	directory := filepath.Dir(Path(data))
	if err := os.MkdirAll(directory, 0700); err != nil {
		return "", err
	}
	file, err := os.CreateTemp(directory, "transfer-")
	if err != nil {
		return "", err
	}
	defer os.Remove(file.Name())
	token := security.Token()
	if _, err = file.WriteString(token); err == nil {
		err = file.Sync()
	}
	closeErr := file.Close()
	if err != nil {
		return "", err
	}
	if closeErr != nil {
		return "", closeErr
	}
	if err := os.Rename(file.Name(), Path(data)); err != nil {
		return "", err
	}
	return token, nil
}
