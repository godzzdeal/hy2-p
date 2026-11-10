package model

import (
	"crypto/sha256"
	"encoding/hex"
	"path"
	"regexp"
	"strings"
	"time"
)

const filenamePartLimit = 64
const filenameFingerprintBytes = 6

var unsafeFilename = regexp.MustCompile(`[^\p{L}\p{N}._-]+`)

func DownloadFilename(server, name string, payload []byte, created time.Time) string {
	digest := sha256.Sum256(payload)
	name = path.Base(strings.ReplaceAll(name, `\`, "/"))
	return safeFilename(server, "server") + "_" + created.UTC().Format("20060102T150405.000Z") + "_" +
		hex.EncodeToString(digest[:filenameFingerprintBytes]) + "_" + safeFilename(name, "file")
}

func safeFilename(value, fallback string) string {
	value = strings.Trim(unsafeFilename.ReplaceAllString(value, "-"), ".-")
	characters := []rune(value)
	if len(characters) > filenamePartLimit {
		value = string(characters[:filenamePartLimit])
	}
	if value == "" {
		return fallback
	}
	return value
}
