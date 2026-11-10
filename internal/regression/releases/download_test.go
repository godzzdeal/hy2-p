package releases_test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"hy2-panel/internal/releases"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
)

func TestChecksumAndSizeGate(t *testing.T) {
	payload := []byte("official binary fixture")
	hash := sha256.Sum256(payload)
	digest := "sha256:" + hex.EncodeToString(hash[:])
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) { writer.Write(payload) }))
	defer server.Close()
	client := &releases.Client{HTTP: server.Client()}
	directory := t.TempDir()
	asset := releases.Asset{URL: server.URL, Size: int64(len(payload)), Digest: digest}
	path, err := client.Download(context.Background(), asset, directory)
	if err != nil {
		t.Fatal(err)
	}
	if err = releases.Verify(path, digest); err != nil {
		t.Fatal(err)
	}
	asset.Digest = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
	if _, err = client.Download(context.Background(), asset, directory); err == nil {
		t.Fatal("bad checksum accepted")
	}
	asset.Digest = digest
	asset.Size++
	if _, err = client.Download(context.Background(), asset, directory); err == nil {
		t.Fatal("truncated download accepted")
	}
	files, _ := os.ReadDir(directory)
	if len(files) != 1 || filepath.Base(path) != files[0].Name() {
		t.Fatal("temporary files leaked")
	}
	os.WriteFile(path, []byte("tampered"), 0700)
	if err = releases.Verify(path, digest); err == nil {
		t.Fatal("corrupt rollback binary accepted")
	}
}
func TestMissingDigestIsRejected(t *testing.T) {
	client := releases.New()
	if _, err := client.Download(context.Background(), releases.Asset{}, t.TempDir()); err == nil {
		t.Fatal("missing checksum accepted")
	}
}

func TestVerifiedCachedBinaryDoesNotNeedTheNetwork(t *testing.T) {
	payload := []byte("verified cached binary")
	digest := sha256.Sum256(payload)
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if requests.Add(1) != 1 {
			writer.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		writer.Write(payload)
	}))
	defer server.Close()
	client := &releases.Client{HTTP: server.Client()}
	asset := releases.Asset{URL: server.URL, Size: int64(len(payload)), Digest: "sha256:" + hex.EncodeToString(digest[:])}
	directory := t.TempDir()
	first, err := client.Download(t.Context(), asset, directory)
	if err != nil {
		t.Fatal(err)
	}
	second, err := client.Download(t.Context(), asset, directory)
	if err != nil || second != first || requests.Load() != 1 {
		t.Fatalf("cache retry: path=%q requests=%d error=%v", second, requests.Load(), err)
	}
	canceled, cancel := context.WithCancel(t.Context())
	cancel()
	if path, err := client.Download(canceled, asset, directory); err == nil || path != "" {
		t.Fatal("canceled download was accepted")
	}
	if err := os.WriteFile(first, []byte("corrupt cached binary!"), 0700); err != nil {
		t.Fatal(err)
	}
	if _, err := client.Download(t.Context(), asset, directory); err == nil || requests.Load() != 1 {
		t.Fatal("corrupt cache was accepted or downloaded over")
	}
}
