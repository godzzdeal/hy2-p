package sources

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
)

type testRuntime struct{ running bool }

func (runtime *testRuntime) Running() bool { return runtime.running }
func (*testRuntime) Generation() string    { return "unchanged-generation" }

type testTransport func(*http.Request) (*http.Response, error)

func (transport testTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport(request)
}

func TestSourceRetentionFollowsProviderList(t *testing.T) {
	runtime := &testRuntime{running: true}
	current, failed := uint64(100), false
	collector := New(&http.Client{Transport: testTransport(func(request *http.Request) (*http.Response, error) {
		if failed {
			return nil, errors.New("fixture unavailable")
		}
		body := `{"alice":1}`
		if request.URL.Path == "/traffic" {
			body = fmt.Sprintf(`{"alice":{"tx":%d}}`, current)
		}
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(body))}, nil
	})})
	first := Source{ID: "first", Address: "http://stats.test", Runtime: runtime}
	removed := first
	removed.ID = "removed"
	read := func(sources ...Source) Result { return collector.Read(context.Background(), sources) }
	if result := read(first, removed); result.Err != nil || result.Counters["alice"].TX != 200 {
		t.Fatalf("initial collection: %+v", result)
	}
	if result := read(first); result.Err != nil || result.Counters["alice"].TX != 0 {
		t.Fatalf("removing another source reset the retained baseline: %+v", result)
	}
	if len(collector.baselines) != 1 || len(collector.generations) != 1 || collector.baselines["first"] == nil {
		t.Fatal("removed source state was retained or existing state was discarded")
	}
	runtime.running = false
	current = 110
	if result := read(first); result.Err != nil || len(result.Online) != 0 {
		t.Fatalf("stopped source retained online sessions: %+v", result)
	}
	if len(collector.baselines) != 1 {
		t.Fatal("stopped existing source was pruned")
	}
	runtime.running = true
	if result := read(first); result.Err != nil || result.Counters["alice"].TX != 10 {
		t.Fatalf("resuming the existing source recounted its traffic: %+v", result)
	}
	failed, current = true, 120
	if result := read(first); result.Err == nil {
		t.Fatal("temporary outage was not reported")
	}
	if len(collector.baselines) != 1 {
		t.Fatal("failed existing source was pruned")
	}
	failed, current = false, 130
	if result := read(first); result.Err != nil || result.Counters["alice"].TX != 20 {
		t.Fatalf("outage recovery recounted its traffic: %+v", result)
	}
	if result := read(); result.Err != nil {
		t.Fatal(result.Err)
	}
	if len(collector.baselines) != 0 || len(collector.generations) != 0 {
		t.Fatal("removed provider retained per-user baseline state")
	}
	if result := read(first); result.Err != nil || result.Counters["alice"].TX != 130 {
		t.Fatalf("a newly registered source inherited discarded history: %+v", result)
	}
}
