package portrestart_test

import (
	"encoding/json"
	"hy2-panel/internal/portcontrol/agent"
	"hy2-panel/internal/portcontrol/protocol"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func TestRestartIsSerializedAndOnlyRestartsThePanel(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux helper")
	}
	root, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	bin := t.TempDir()
	if err := os.WriteFile(filepath.Join(bin, "bash"), []byte("#!/bin/sh\nprintf '%s' \"$2\" > \"$HY2_INSTALL_DIR/executed\"\n"), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))
	if err := os.WriteFile(filepath.Join(root, "current"), []byte(strings.Repeat("a", 40)), 0600); err != nil {
		t.Fatal(err)
	}
	helper, err := agent.New(root)
	if err != nil {
		t.Fatal(err)
	}
	handler := helper.Handler()
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest("POST", protocol.RestartPath, nil))
	if response.Code != 202 {
		t.Fatalf("restart: %d %s", response.Code, response.Body.String())
	}
	var operation protocol.Status
	if err := json.Unmarshal(response.Body.Bytes(), &operation); err != nil {
		t.Fatal(err)
	}
	if !protocol.TicketPattern.MatchString(operation.ID) || !operation.Busy || operation.Operation != "restart" {
		t.Fatalf("bad ticket: %+v", operation)
	}
	busy := httptest.NewRecorder()
	handler.ServeHTTP(busy, httptest.NewRequest("POST", protocol.RestartPath, nil))
	if busy.Code != 409 {
		t.Fatalf("concurrent restart accepted: %d", busy.Code)
	}
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		status := httptest.NewRecorder()
		handler.ServeHTTP(status, httptest.NewRequest("GET", "/udp/"+operation.ID, nil))
		if err := json.Unmarshal(status.Body.Bytes(), &operation); err != nil {
			t.Fatal(err)
		}
		if !operation.Busy {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if operation.Phase != "success" {
		t.Fatalf("restart result: %+v", operation)
	}
	command, err := os.ReadFile(filepath.Join(root, "executed"))
	if err != nil || string(command) != "restart-panel" {
		t.Fatalf("unexpected command: %s %v", command, err)
	}
}
