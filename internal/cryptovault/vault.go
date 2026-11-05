package cryptovault

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type Vault struct {
	aead   cipher.AEAD
	lookup []byte
}

func Open(data string) (*Vault, error) {
	directory := filepath.Join(data, "secrets")
	if err := os.MkdirAll(directory, 0700); err != nil {
		return nil, err
	}
	path := filepath.Join(directory, "users.key")
	key, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		key = make([]byte, 32)
		if _, err = rand.Read(key); err != nil {
			return nil, err
		}
		file, createErr := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
		if createErr != nil {
			return nil, createErr
		}
		_, err = file.Write(key)
		if err == nil {
			err = file.Sync()
		}
		file.Close()
	}
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	lookup := sha256.Sum256(append(append([]byte{}, key...), []byte("hy2-password-lookup")...))
	return &Vault{aead: aead, lookup: lookup[:]}, nil
}
func (vault *Vault) Prefix(password string) string {
	digest := hmac.New(sha256.New, vault.lookup)
	digest.Write([]byte(password))
	return "enc:v1:" + hex.EncodeToString(digest.Sum(nil)) + ":"
}
func (vault *Vault) Seal(password string) (string, error) {
	nonce := make([]byte, vault.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	prefix := vault.Prefix(password)
	ciphertext := vault.aead.Seal(nonce, nonce, []byte(password), []byte(prefix))
	return prefix + base64.RawStdEncoding.EncodeToString(ciphertext), nil
}
func (vault *Vault) OpenPassword(record string) (string, error) {
	if !strings.HasPrefix(record, "enc:v1:") {
		return record, nil
	} // Read-only compatibility with records from the original prototype.
	parts := strings.SplitN(record, ":", 4)
	if len(parts) != 4 {
		return "", errors.New("неверная запись пароля")
	}
	payload, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil || len(payload) < vault.aead.NonceSize() {
		return "", errors.New("повреждён зашифрованный пароль")
	}
	nonce := payload[:vault.aead.NonceSize()]
	plain, err := vault.aead.Open(nil, nonce, payload[vault.aead.NonceSize():], []byte(strings.Join(parts[:3], ":")+":"))
	if err != nil {
		return "", errors.New("не удалось расшифровать пароль: проверьте ключ из резервной копии")
	}
	return string(plain), nil
}
