package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"strings"
)

func Env(key, d string) string {
	if digest := os.Getenv(key); digest != "" {
		return digest
	}
	return d
}

func Token() string {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return hex.EncodeToString(bytes)
}

func Hash(value string) string {
	digest := sha256.Sum256([]byte(value))
	return hex.EncodeToString(digest[:])
}

func CertificatePin(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil
	}
	value = strings.ReplaceAll(value, ":", "")
	digest, err := hex.DecodeString(value)
	if err != nil || len(digest) != sha256.Size {
		return "", errors.New("pinSHA256 должен содержать 64 шестнадцатеричных символа")
	}
	return hex.EncodeToString(digest), nil
}
