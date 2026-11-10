package coretools_test

import (
	"context"
	"encoding/pem"
	"hy2-panel/internal/core/tools"
	"os"
	"path/filepath"
	"testing"
)

func TestMain(m *testing.M) {
	if os.Getenv("HY2_TEST_ECH_HELPER") == "1" && len(os.Args) > 1 && os.Args[1] == "ech" {
		path := os.Args[len(os.Args)-1]
		key := pem.EncodeToMemory(&pem.Block{Type: "ECH KEYS", Bytes: []byte("private-material")})
		configs := pem.EncodeToMemory(&pem.Block{Type: "ECH CONFIGS", Bytes: []byte{0, 3, 1, 2, 3}})
		if os.WriteFile(path, append(key, configs...), 0600) != nil {
			os.Exit(1)
		}
		os.Exit(0)
	}
	os.Exit(m.Run())
}
func TestGenerationKeepsExistingKeyAndValidatesNames(t *testing.T) {
	t.Setenv("HY2_TEST_ECH_HELPER", "1")
	data := t.TempDir()
	first, err := tools.Generate(context.Background(), os.Args[0], data, "public.example.com")
	if err != nil {
		t.Fatal(err)
	}
	second, err := tools.Generate(context.Background(), os.Args[0], data, "other.example.com")
	if err != nil || first.KeyPath == second.KeyPath {
		t.Fatal(second, err)
	}
	if _, err := os.Stat(first.KeyPath); err != nil {
		t.Fatal("old key replaced")
	}
	for _, name := range []string{"--help", "host;id", "https://example.com", "a..com", "x\n.com"} {
		if tools.ValidName(name) {
			t.Fatal(name)
		}
	}
	if _, err = tools.Generate(context.Background(), filepath.Join(data, "missing"), data, "public.example.com"); err == nil {
		t.Fatal("missing binary accepted")
	}
}

func TestPublicNameFromActualHysteriaKey(t *testing.T) {
	binary := os.Getenv("HY2_ECH_BINARY")
	if binary == "" {
		t.Skip("set HY2_ECH_BINARY to test the real Hysteria ECH generator")
	}
	result, err := tools.Generate(context.Background(), binary, t.TempDir(), "public.example.com")
	if err != nil {
		t.Fatal(err)
	}
	read, err := tools.Inspect(result.KeyPath)
	if err != nil || read.PublicName != "public.example.com" || read.ConfigList != result.ConfigList {
		t.Fatalf("public metadata mismatch: %q %v", read.PublicName, err)
	}
}
