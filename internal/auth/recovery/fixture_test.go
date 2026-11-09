package recovery_test

import (
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/auth/credentials"
	"path/filepath"
	"testing"
)

const oldPassword = "fixture-old-password-1234"
const newPassword = "fixture-new-password-5678"
const cloudPassword = "fixture-cloud-password-1234"

func setup(t *testing.T) (string, []byte) {
	t.Helper()
	data := t.TempDir()
	hash, err := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	store, err := credentials.New("initial", hash, filepath.Join(data, "admin"))
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Change(oldPassword, "operator", ""); err != nil {
		t.Fatal(err)
	}
	return data, hash
}
