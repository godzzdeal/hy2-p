package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"os"
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
