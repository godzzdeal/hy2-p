package releases_test

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"hy2-panel/internal/releases"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

// Measures a verified warm cache; the loopback origin also counts redundant requests.
func BenchmarkCachedDownload(b *testing.B) {
	const payloadBytes = 1 << 20
	payload := bytes.Repeat([]byte{'x'}, payloadBytes)
	digest := sha256.Sum256(payload)
	var requests atomic.Uint64
	origin := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		if _, err := writer.Write(payload); err != nil {
			b.Error(err)
		}
	}))
	b.Cleanup(origin.Close)
	client := &releases.Client{HTTP: origin.Client()}
	asset := releases.Asset{URL: origin.URL, Size: payloadBytes, Digest: "sha256:" + hex.EncodeToString(digest[:])}
	directory := b.TempDir()
	first, err := client.Download(b.Context(), asset, directory)
	if err != nil {
		b.Fatal(err)
	}
	requests.Store(0)
	b.SetBytes(payloadBytes)
	b.ReportAllocs()
	for b.Loop() {
		path, err := client.Download(b.Context(), asset, directory)
		if err != nil || path != first {
			b.Fatalf("cache download: path=%q error=%v", path, err)
		}
	}
	b.ReportMetric(float64(requests.Load())/float64(b.N), "http-requests/op")
}
