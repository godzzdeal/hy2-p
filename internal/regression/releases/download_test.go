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
