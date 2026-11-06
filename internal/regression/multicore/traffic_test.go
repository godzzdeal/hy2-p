package multicore_test

import (
	"context"
	"encoding/json"
	"fmt"
	"hy2-panel/internal/security"
	"hy2-panel/internal/traffic/sources"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

func TestDeviceCountersAggregateWithoutResettingOtherDevices(t *testing.T) {
	user := strings.Repeat("a", 16)
	first := security.DeviceIdentity(user, strings.Repeat("b", 32), strings.Repeat("c", 16))
	second := security.DeviceIdentity(user, strings.Repeat("d", 32), strings.Repeat("e", 16))
	rotated := security.DeviceIdentity(user, strings.Repeat("b", 32), strings.Repeat("f", 16))
	var changed atomic.Bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, count := first, uint64(100)
		if changed.Load() {
			id, count = rotated, 5
		}
		if r.URL.Path == "/online" {
			json.NewEncoder(w).Encode(map[string]int{id: 1, second: 1, user: 1})
			return
		}
		json.NewEncoder(w).Encode(map[string]sources.Counter{id: {TX: count}, second: {TX: 200}, user: {TX: 50}})
	}))
	defer server.Close()
	collector := sources.New(server.Client())
	inputs := []sources.Source{{ID: "core", Address: server.URL, Runtime: &runtime{"generation", true}}}
	firstSample := collector.Read(context.Background(), inputs)
	if firstSample.Err != nil || firstSample.Counters[user].TX != 350 || firstSample.Online[user] != 3 || len(firstSample.Counters) != 1 {
		t.Fatal(firstSample)
	}
	changed.Store(true)
	next := collector.Read(context.Background(), inputs)
	if next.Err != nil || next.Counters[user].TX != 5 {
		t.Fatal("credential rotation reset other device baselines", next)
	}
}

type runtime struct {
	generation string
	running    bool
}

func (state *runtime) Running() bool      { return state.running }
func (state *runtime) Generation() string { return state.generation }

func TestSharedTrafficAcrossIndependentGenerations(t *testing.T) {
	first, second := &runtime{"first", true}, &runtime{"second", true}
	total := uint64(100)
	stats := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "secret" {
			writer.WriteHeader(401)
			return
		}
		if request.URL.Path == "/online" {
			fmt.Fprint(writer, `{"user":1}`)
			return
		}
		fmt.Fprintf(writer, `{"user":{"tx":%d,"rx":%d}}`, total, total*2)
	}))
	defer stats.Close()
	collector := sources.New(stats.Client())
	inputs := []sources.Source{{ID: "first", Address: stats.URL, Secret: "secret", Runtime: first}, {ID: "second", Address: stats.URL, Secret: "secret", Runtime: second}}
	sample := collector.Read(context.Background(), inputs)
	if sample.Err != nil || sample.Counters["user"].TX != 200 || sample.Online["user"] != 2 {
		t.Fatal(sample)
	}
	sample = collector.Read(context.Background(), inputs)
	if sample.Counters["user"].TX != 0 {
		t.Fatal("traffic counted twice", sample)
	}
	total = 120
	sample = collector.Read(context.Background(), inputs)
	if sample.Counters["user"].TX != 40 {
		t.Fatal("bad delta", sample)
	}
	first.generation = "restarted"
	sample = collector.Read(context.Background(), inputs)
	if sample.Counters["user"].TX != 120 {
		t.Fatal("one restart reset the other baseline", sample)
	}
	second.running = false
	sample = collector.Read(context.Background(), inputs)
	if sample.Online["user"] != 1 || sample.Counters["user"].TX != 0 {
		t.Fatal(sample)
	}
	inputs[0].Secret = "wrong"
	if sample = collector.Read(context.Background(), inputs); sample.Err == nil {
		t.Fatal("missing stats failure")
	}
}
