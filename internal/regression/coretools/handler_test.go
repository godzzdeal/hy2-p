package coretools_test

import (
	"encoding/json"
	"hy2-panel/internal/core/tools"
	"hy2-panel/internal/testutil"
	"net/http/httptest"
	"testing"
)

func TestStatsReturnsActualRuntimeValuesWithoutCaching(t *testing.T) {
	handler := tools.Handler{Address: "127.0.0.1:10000", Secret: "actual-runtime-secret", Running: func() bool { return true }}
	response := httptest.NewRecorder()
	handler.Stats(response, testutil.Request("GET", "/tools/traffic-stats", ""))
	var result struct {
		Listen, Secret string
		Running        bool
	}
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if result.Secret != handler.Secret || result.Listen != handler.Address || !result.Running || response.Header().Get("Cache-Control") != "no-store" {
		t.Fatal(response.Body.String())
	}
	bad := httptest.NewRecorder()
	handler.Create(bad, testutil.Request("POST", "/tools/ech", `{"publicName":"--help"}`))
	var problem map[string]string
	if bad.Code != 400 || json.Unmarshal(bad.Body.Bytes(), &problem) != nil || problem["error"] == "" {
		t.Fatal(bad.Body.String())
	}
}
