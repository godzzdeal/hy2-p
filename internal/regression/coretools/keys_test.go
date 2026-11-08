package coretools_test

import (
	"encoding/pem"
	"hy2-panel/internal/core/tools"
	"os"
	"path/filepath"
	"testing"
)

func TestOnlyPublicECHConfigIsReturned(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ech.pem")
	key := pem.EncodeToMemory(&pem.Block{Type: "ECH KEYS", Bytes: []byte("private-material")})
	public := pem.EncodeToMemory(&pem.Block{Type: "ECH CONFIGS", Bytes: []byte{0, 3, 1, 2, 3}})
	if err := os.WriteFile(path, append(key, public...), 0600); err != nil {
		t.Fatal(err)
	}
	result, err := tools.Inspect(path)
	if err != nil || result.ConfigList != "AAMBAgM=" {
		t.Fatal(result, err)
	}
	os.WriteFile(path, key, 0600)
	if _, err := tools.Inspect(path); err == nil {
		t.Fatal("private-only file exported")
	}
	os.WriteFile(path, []byte("-----BEGIN CERTIFICATE-----\nYQ==\n-----END CERTIFICATE-----"), 0600)
	if _, err := tools.Inspect(path); err == nil {
		t.Fatal("ACME certificate accepted as ECH")
	}
}
