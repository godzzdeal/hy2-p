package ech_test

import (
	"encoding/binary"
	"encoding/pem"
	"os"
	"path/filepath"
	"testing"
)

func prefixed(data []byte) []byte {
	return append(binary.BigEndian.AppendUint16(nil, uint16(len(data))), data...)
}
func config(name string) []byte {
	contents := []byte{1, 0, 32}
	contents = append(contents, prefixed(make([]byte, 32))...)
	contents = append(contents, prefixed([]byte{0, 1, 0, 1})...)
	contents = append(contents, 0, byte(len(name)))
	contents = append(contents, []byte(name)...)
	contents = append(contents, 0, 0)
	return append([]byte{0xfe, 0x0d}, prefixed(contents)...)
}
func writeKey(t *testing.T, path, name string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		t.Fatal(err)
	}
	data := pem.EncodeToMemory(&pem.Block{Type: "ECH CONFIGS", Bytes: prefixed(config(name))})
	data = append(data, pem.EncodeToMemory(&pem.Block{Type: "ECH KEYS", Bytes: []byte("PRIVATE-SECRET")})...)
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
}
