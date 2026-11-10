package configuration_test

import (
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestHistoryRejectsCorruptStoredConfiguration(t *testing.T) {
	app := testutil.New(t)
	if _, err := app.DB.Exec("INSERT INTO history(created,body) VALUES(?,?)", "2026-01-01T00:00:00Z", "{broken-fixture-record"); err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	app.Config.History(response, testutil.Request("GET", "/api/history", ""))
	if response.Code != 500 {
		t.Fatalf("corrupt history returned %d: %s", response.Code, response.Body.String())
	}
}
