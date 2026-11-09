package local_test

import (
	"hy2-panel/internal/transfer/local"
	"net/http"
	"net/http/httptest"
	"os"
	"runtime"
	"testing"
)

func TestVPNLoopbackAccessCannotExportOrImportWithoutLocalCapability(t *testing.T) {
	directory := t.TempDir()
	calls := 0
	handle := func(w http.ResponseWriter, r *http.Request) { calls++; w.WriteHeader(204) }
	handler, err := local.New(directory, handle, handle)
	if err != nil {
		t.Fatal(err)
	}
	token, err := os.ReadFile(local.Path(directory))
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" {
		stat, err := os.Stat(local.Path(directory))
		if err != nil || stat.Mode().Perm() != 0600 {
			t.Fatal("unsafe CLI token permissions")
		}
	}
	for _, method := range []string{"GET", "POST"} {
		path := "/transfer"
		if method == "POST" {
			path += "/apply"
		}
		for _, header := range []string{"", "Bearer bad-token", "Bearer " + string(token)} {
			request := httptest.NewRequest(method, path, nil)
			request.RemoteAddr = "127.0.0.1:1234"
			request.Header.Set("Authorization", header)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			expected := 401
			if header == "Bearer "+string(token) {
				expected = 204
			}
			if response.Code != expected {
				t.Fatal(method, response.Code)
			}
		}
	}
	if calls != 2 {
		t.Fatal("unauthorized transfer handler executed")
	}
	renewed, err := local.New(directory, handle, handle)
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("GET", "/transfer", nil)
	request.Header.Set("Authorization", "Bearer "+string(token))
	response := httptest.NewRecorder()
	renewed.ServeHTTP(response, request)
	if response.Code != 401 {
		t.Fatal("old token remained valid after restart")
	}
}
