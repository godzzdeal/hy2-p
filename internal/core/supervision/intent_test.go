package supervision_test

import (
	"hy2-panel/internal/core"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestCoreIntentSurvivesPanelShutdownAndManualStop(t *testing.T) {
	app := testutil.New(t)
	directory := t.TempDir()
	wanted, err := supervision.ReadIntent(directory)
	if err != nil || wanted {
		t.Fatal("first start must remain stopped", err)
	}
	if err = supervision.SaveIntent(directory, true); err != nil {
		t.Fatal(err)
	}
	handler, err := core.New(app.DB, app.Config, directory, "test")
	if err != nil {
		t.Fatal(err)
	}
	if !handler.Watchdog.Snapshot().DesiredRunning {
		t.Fatal("running intent not restored")
	}
	if err = handler.Stop(); err != nil {
		t.Fatal(err)
	}
	wanted, err = supervision.ReadIntent(directory)
	if err != nil || !wanted {
		t.Fatal("panel shutdown erased running intent")
	}
	handler, err = core.New(app.DB, app.Config, directory, "test")
	if err != nil {
		t.Fatal(err)
	}
	request := testutil.Request("POST", "/core/stop", "")
	request.SetPathValue("action", "stop")
	writer := httptest.NewRecorder()
	handler.Control(writer, request)
	if writer.Code != 200 {
		t.Fatal(writer.Body.String())
	}
	wanted, err = supervision.ReadIntent(directory)
	if err != nil || wanted {
		t.Fatal("manual stop not persisted")
	}
}
