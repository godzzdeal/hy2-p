package transfer_test

import (
	"crypto/sha256"
	"encoding/hex"
	"hy2-panel/internal/transfer/model"
	"mime"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestDownloadFilenameHasServerUTCDateContentFingerprintAndOriginalName(t *testing.T) {
	created := time.Date(2026, 11, 11, 4, 5, 6, 789000000, time.FixedZone("MSK", 3*60*60))
	filename := model.DownloadFilename("vpn.example.com", "hy2-p.json", []byte("abc"), created)
	if filename != "vpn.example.com_20261111T010506.789Z_ba7816bf8f01_hy2-p.json" {
		t.Fatal(filename)
	}
	unsafe := model.DownloadFilename("../../bad\r\nhost", `C:\private\hy2-p.json`, []byte("abc"), created)
	if strings.ContainsAny(unsafe, "/\\\r\n") || !strings.HasSuffix(unsafe, "_hy2-p.json") {
		t.Fatal("unsafe filename", unsafe)
	}
}

func TestDownloadHeaderFingerprintMatchesTheActualFile(t *testing.T) {
	service := setup(t)
	response := httptest.NewRecorder()
	service.Download(response, httptest.NewRequest("GET", "https://vpn.example.com:9443/transfer", nil))
	disposition, parameters, err := mime.ParseMediaType(response.Header().Get("Content-Disposition"))
	if err != nil || disposition != "attachment" {
		t.Fatal("invalid download header", err)
	}
	digest := sha256.Sum256(response.Body.Bytes())
	filename := parameters["filename"]
	if !strings.HasPrefix(filename, "vpn.example.com_") || !strings.HasSuffix(filename, "_"+hex.EncodeToString(digest[:6])+"_hy2-p.json") {
		t.Fatal("wrong download identity", filename)
	}
}
