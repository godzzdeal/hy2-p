package traffic

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type testRuntime struct {
	running    bool
	generation string
	kicked     []string
}

func (runtime *testRuntime) Running() bool      { return runtime.running }
func (runtime *testRuntime) Generation() string { return runtime.generation }
func (runtime *testRuntime) Kick(id string)     { runtime.kicked = append(runtime.kicked, id) }
func TestPersistentTrafficAndQuota(t *testing.T) {
	runtime := &testRuntime{running: true, generation: "first"}
	counters := map[string]Counter{"alice": {TX: 100, RX: 200}}
	online := map[string]int{"alice": 2}
	failed := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "secret" {
			t.Error("missing API authorization")
		}
		if failed {
			w.WriteHeader(503)
			return
		}
		if r.URL.Path == "/traffic" {
			json.NewEncoder(w).Encode(counters)
		} else {
			json.NewEncoder(w).Encode(online)
		}
	}))
	defer server.Close()
	directory := t.TempDir()
	service, err := New(directory, "secret", runtime)
	if err != nil {
		t.Fatal(err)
	}
	service.address = server.URL
	collect := func() { service.Collect(context.Background()) }
	collect()
	collect()
	usage := service.Snapshot().Users["alice"]
	if usage.Upload != 100 || usage.Download != 200 || usage.Online != 2 || usage.LastSeen == "" {
		t.Fatalf("%+v", usage)
	}
	counters["alice"] = Counter{TX: 150, RX: 250}
	collect()
	if service.Snapshot().Users["alice"].Upload != 150 {
		t.Fatal("delta counted twice")
	}
	request := httptest.NewRequest("PUT", "/users/alice/traffic", nil)
	request.SetPathValue("id", "alice")
	service.mu.Lock()
	usage = service.state.Users["alice"]
	usage.Limit = 400
	service.state.Users["alice"] = usage
	service.mu.Unlock()
	collect()
	if service.Allowed("alice") || len(runtime.kicked) == 0 {
		t.Fatal("quota not enforced")
	}
	runtime.generation = "second"
	counters["alice"] = Counter{TX: 10, RX: 20}
	collect()
	usage = service.Snapshot().Users["alice"]
	if usage.Upload != 160 || usage.Download != 270 {
		t.Fatalf("restart reset totals: %+v", usage)
	}
	restarted, err := New(directory, "secret", runtime)
	if err != nil {
		t.Fatal(err)
	}
	if restarted.Snapshot().Users["alice"].Upload != 160 || restarted.Allowed("alice") {
		t.Fatal("totals/limit lost")
	}
	if restarted.Snapshot().Available || restarted.Snapshot().Users["alice"].Online != 0 {
		t.Fatal("stale online status")
	}
	failed = true
	collect()
	if service.Snapshot().Available {
		t.Fatal("failed API reported available")
	}
	runtime.running = false
	collect()
	if !service.Snapshot().Available || service.Snapshot().Users["alice"].Online != 0 {
		t.Fatal("stopped core reported online")
	}
}
func TestAdjustKeepsBaselineAndRejectsInvalidValues(t *testing.T) {
	runtime := &testRuntime{}
	service, err := New(t.TempDir(), "", runtime)
	if err != nil {
		t.Fatal(err)
	}
	service.state.Users["alice"] = Usage{Upload: 100, Download: 200}
	service.baseline["alice"] = Counter{TX: 100, RX: 200}
	adjust := func(body string) int {
		reader := httptest.NewRequest("PUT", "/traffic", strings.NewReader(body))
		reader.SetPathValue("id", "alice")
		writer := httptest.NewRecorder()
		service.Adjust(writer, reader)
		return writer.Code
	}
	if adjust(`{"upload":0,"download":0,"limit":50}`) != 200 {
		t.Fatal("reset failed")
	}
	service.addCounter("alice", Counter{TX: 110, RX: 220})
	usage := service.Snapshot().Users["alice"]
	if usage.Upload != 10 || usage.Download != 20 || usage.Limit != 50 {
		t.Fatalf("%+v", usage)
	}
	if adjust(`{"limit":60}`) != 200 || service.Snapshot().Users["alice"].Upload != 10 || service.Snapshot().Users["alice"].Download != 20 {
		t.Fatal("editing quota overwrote accumulated traffic")
	}
	for _, body := range []string{`{"upload":-1}`, `{"upload":9007199254740992}`, `{"upload":9007199254740991,"download":1}`} {
		if adjust(body) != 400 {
			t.Fatal("unsafe counters accepted")
		}
	}
}
