package multicore_test

import (
	"context"
	"fmt"
	"hy2-panel/internal/traffic/sources"
	"net/http"
	"net/http/httptest"
	"testing"
)

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
