package recovery

import (
	"encoding/json"
	"io"
	"path/filepath"
	"strings"

	"hy2-panel/internal/auth/credentials"
)

func Reset(input io.Reader, output io.Writer, data, fallbackUsername string) error {
	// Read the password from stdin, never from process arguments or environment.
	payload, err := io.ReadAll(io.LimitReader(input, credentials.MaxPasswordBytes+2))
	if err != nil {
		return err
	}
	password := strings.TrimSuffix(strings.TrimSuffix(string(payload), "\n"), "\r")
	username, cloud, err := credentials.ResetAdmin(filepath.Join(data, "admin"), fallbackUsername, password)
	if err != nil {
		return err
	}
	// The secret is displayed by the host manager; it never enters container logs.
	return json.NewEncoder(output).Encode(struct {
		Username         string `json:"username"`
		HasCloudPassword bool   `json:"hasCloudPassword"`
	}{username, cloud})
}
