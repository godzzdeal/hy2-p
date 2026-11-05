//go:build integration

package engine_test

import (
	"context"
	"encoding/json"
	"fmt"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core"
	"hy2-panel/internal/core/update"
	"hy2-panel/internal/testutil"
	"net"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

const trialDeadline = 60 * time.Second
const trialPoll = 50 * time.Millisecond

func complete(t *testing.T, handler *core.Handler) update.Status {
	t.Helper()
	deadline := time.Now().Add(trialDeadline)
	for time.Now().Before(deadline) {
		status := handler.Updates.Snapshot()
		if !status.Busy {
			return status
		}
		time.Sleep(trialPoll)
	}
	t.Fatal("real engine operation timed out")
	return update.Status{}
}
func TestOfficialEngineUpdateAndRollback(t *testing.T) {
	original := os.Getenv("HYSTERIA_TEST_BINARY")
	if original == "" {
		t.Skip("set HYSTERIA_TEST_BINARY to the SHA-256 verified v2.12.3 binary")
	}
	listener, err := net.Listen("tcp", "127.0.0.1:9999")
	if err != nil {
		t.Skip("isolated health port already in use")
	}
	listener.Close()
	t.Setenv("HYSTERIA_BIN", original)
	app := testutil.New(t)
	directory := t.TempDir()
	cert, key := certificate(t, directory)
	settings := configuration.Settings{Host: "localhost", Port: "8443", Config: fmt.Sprintf("listen: 127.0.0.1:0\ntls:\n  cert: %s\n  key: %s\n", cert, key)}
	payload, _ := json.Marshal(settings)
	writer := httptest.NewRecorder()
	app.Config.Save(writer, testutil.Request("PUT", "/settings", string(payload)))
	if writer.Code != 200 {
		t.Fatal(writer.Body.String())
	}
	handler, err := core.New(app.DB, app.Config, directory, "integration-secret")
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Stop()
	ctx, cancel := context.WithTimeout(context.Background(), trialDeadline)
	defer cancel()
	if err = handler.Activate(ctx, original, true); err != nil {
		t.Fatal(err)
	}
	if err = handler.Updates.Begin("app/v2.13.0", false); err != nil {
		t.Fatal(err)
	}
	status := complete(t, handler)
	if status.Result.Phase != "success" || status.Current != "app/v2.13.0" || status.Previous != "app/v2.12.3" || !handler.Running() {
		t.Fatalf("update: %+v", status)
	}
	if err = handler.Updates.Begin("", true); err != nil {
		t.Fatal(err)
	}
	status = complete(t, handler)
	if status.Result.Phase != "success" || status.Current != "app/v2.12.3" || !handler.Running() {
		t.Fatalf("rollback: %+v", status)
	}
	t.Log("official v2.12.3 -> v2.13.0 -> v2.12.3; health API verified; original running state preserved")
}
