package ech_test

import (
	"encoding/base64"
	"hy2-panel/internal/core/tools"
	"hy2-panel/internal/core/tools/ech"
	"path/filepath"
	"strings"
	"testing"
)

func TestPublicNameUsesECHConfigListAndRejectsAmbiguity(t *testing.T) {
	valid := prefixed(config("public.example.com"))
	if got := ech.PublicName(valid); got != "public.example.com" {
		t.Fatal(got)
	}
	for end := range len(valid) {
		if ech.PublicName(valid[:end]) != "" {
			t.Fatalf("accepted truncated config at %d", end)
		}
	}
	if ech.PublicName(append(valid, 0)) != "" {
		t.Fatal("accepted trailing bytes")
	}
	multiple := prefixed(append(config("one.example.com"), config("two.example.com")...))
	if ech.PublicName(multiple) != "" {
		t.Fatal("selected an ambiguous public name")
	}
	future := append([]byte{0, 1, 0, 1, 0}, config("public.example.com")...)
	if ech.PublicName(prefixed(future)) != "public.example.com" {
		t.Fatal("did not skip unknown version")
	}
}
func TestInspectIncludesPublicNameWithoutPrivateKey(t *testing.T) {
	path := filepath.Join(t.TempDir(), "ech.pem")
	writeKey(t, path, "public.example.com")
	result, err := tools.Inspect(path)
	if err != nil || result.PublicName != "public.example.com" {
		t.Fatalf("%+v %v", result, err)
	}
	decoded, err := base64.StdEncoding.DecodeString(result.ConfigList)
	if err != nil || strings.Contains(string(decoded), "PRIVATE-SECRET") {
		t.Fatal("private material exposed")
	}
}
