package aclfiles_test

import (
	"bytes"
	"encoding/json"
	"hy2-panel/internal/aclfiles"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestMultipartUploadReturnsAPathWithoutApplyingSettings(t *testing.T) {
	data := t.TempDir()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "../../rules.txt")
	if err != nil {
		t.Fatal(err)
	}
	part.Write([]byte("direct(all)\n"))
	writer.Close()
	request := httptest.NewRequest("POST", "/tools/acl-file?kind=file", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	response := httptest.NewRecorder()
	aclfiles.Handler(data)(response, request)
	if response.Code != 200 {
		t.Fatal(response.Code, response.Body.String())
	}
	var result struct {
		Path string `json:"path"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if payload, err := os.ReadFile(result.Path); err != nil || string(payload) != "direct(all)\n" {
		t.Fatalf("upload: %s %v", payload, err)
	}
}

func TestUploadUsesItsOwnReadDeadline(t *testing.T) {
	const serverDeadline = 50 * time.Millisecond
	const bodyDelay = 100 * time.Millisecond
	server := httptest.NewUnstartedServer(aclfiles.Handler(t.TempDir()))
	server.Config.ReadTimeout = serverDeadline
	server.Start()
	defer server.Close()
	reader, pipe := io.Pipe()
	defer reader.Close()
	multipartWriter := multipart.NewWriter(pipe)
	finished := make(chan struct{})
	go func() {
		defer close(finished)
		defer pipe.Close()
		part, err := multipartWriter.CreateFormFile("file", "rules.txt")
		if err != nil {
			return
		}
		part.Write([]byte("# first\n"))
		time.Sleep(bodyDelay)
		part.Write([]byte("direct(all)\n"))
		multipartWriter.Close()
	}()
	request, err := http.NewRequest("POST", server.URL+"?kind=file", reader)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Content-Type", multipartWriter.FormDataContentType())
	client := http.Client{Timeout: time.Second}
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		payload, _ := io.ReadAll(response.Body)
		t.Fatalf("upload deadline: %d %s", response.StatusCode, payload)
	}
	<-finished
}
