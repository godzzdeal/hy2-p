package security_test

import (
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/cryptovault"
	"strings"
	"testing"
)

func TestEncryptedPasswordRoundTripAndTamper(t *testing.T) {
	directory := t.TempDir()
	vault, err := cryptovault.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	password := "unique-secret-password-123"
	record, err := vault.Seal(password)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(record, password) {
		t.Fatal("plaintext leaked")
	}
	restored, err := cryptovault.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	plain, err := restored.OpenPassword(record)
	if err != nil || plain != password {
		t.Fatal("roundtrip failed")
	}
	if _, err = restored.OpenPassword(record[:len(record)-2] + "AA"); err == nil {
		t.Fatal("tamper accepted")
	}
}
func TestAdministratorChangePersistsAndVerifiesCurrentPassword(t *testing.T) {
	directory := t.TempDir()
	hash, _ := bcrypt.GenerateFromPassword([]byte("original-password-123"), bcrypt.MinCost)
	store, err := credentials.New("admin", hash, directory)
	if err != nil {
		t.Fatal(err)
	}
	if err = store.Change("wrong", "new-admin", "replacement-password-123"); err == nil {
		t.Fatal("wrong password accepted")
	}
	if err = store.Change("original-password-123", "new-admin", "replacement-password-123"); err != nil {
		t.Fatal(err)
	}
	restored, err := credentials.New("admin", hash, directory)
	if err != nil || !restored.Verify("new-admin", "replacement-password-123") || restored.Verify("admin", "original-password-123") {
		t.Fatal("credential change not persisted")
	}
}
