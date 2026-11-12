package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
)

// rclone's documented password format, not encryption at rest. Access is
// protected by the host's private directory (0700) and record files (0600).
func obscure(password string) (string, error) {
	key := []byte{0x9c, 0x93, 0x5b, 0x48, 0x73, 0x0a, 0x55, 0x4d, 0x6b, 0xfd, 0x7c, 0x63, 0xc8, 0x86, 0xa9, 0x2b, 0xd3, 0x90, 0x19, 0x8e, 0xb8, 0x12, 0x8a, 0xfb, 0xf4, 0xde, 0x16, 0x2b, 0x8b, 0x95, 0xf6, 0x38}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	buffer := make([]byte, aes.BlockSize+len(password))
	rand.Read(buffer[:aes.BlockSize])
	cipher.NewCTR(block, buffer[:aes.BlockSize]).XORKeyStream(buffer[aes.BlockSize:], []byte(password))
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}
