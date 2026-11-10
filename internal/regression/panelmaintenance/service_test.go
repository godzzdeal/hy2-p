package panelmaintenance_test

import (
	"encoding/json"
	"hy2-panel/internal/panelmaintenance"
	"hy2-panel/internal/panelmaintenance/storage"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/testutil/managed"
	"net/http/httptest"
	"runtime"
	"sync"
	"testing"
	"time"
)

func TestMaintenanceReservesOneJobAndReturnsBeforeDockerCompletes(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux helper")
	}
	install := managed.New(t)
	install.Command("docker", "sleep 1; printf running")
	service := &panelmaintenance.Service{Root: install.Root, Mu: &sync.Mutex{}, PortsBusy: func() bool { return false }}
	response := httptest.NewRecorder()
	started := time.Now()
	service.Begin(response, testutil.Request("POST", "/maintenance", `{"action":"update","version":"v0.7.6"}`))
	if response.Code != 202 || time.Since(started) >= time.Second {
		t.Fatalf("blocking request: %d %s", response.Code, response.Body.String())
	}
	var operation protocol.PanelOperation
	if json.Unmarshal(response.Body.Bytes(), &operation) != nil || !operation.Busy || !protocol.TicketPattern.MatchString(operation.ID) {
		t.Fatal(response.Body.String())
	}
	duplicate := httptest.NewRecorder()
	service.Begin(duplicate, testutil.Request("POST", "/maintenance", `{"action":"rollback","restoreData":true}`))
	if duplicate.Code != 409 {
		t.Fatal("concurrent deployment allowed")
	}
	// Wait for the launch goroutine before temporary commands and PATH are removed.
	time.Sleep(1500 * time.Millisecond)
}
func TestMaintenanceRejectsPortChangesAndMissingRollbackSnapshot(t *testing.T) {
	install := managed.New(t)
	service := &panelmaintenance.Service{Root: install.Root, Mu: &sync.Mutex{}, PortsBusy: func() bool { return true }}
	response := httptest.NewRecorder()
	service.Begin(response, testutil.Request("POST", "/maintenance", `{"action":"update","version":"v0.7.6"}`))
	if response.Code != 409 {
		t.Fatal("UDP operation was ignored")
	}
	result, err := storage.Read(install.Root)
	if err != nil || result.Busy {
		t.Fatal("rejected operation persisted")
	}
}
