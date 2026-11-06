package panelupdates_test

import (
	"context"
	"hy2-panel/internal/buildinfo/updates"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
)

func TestConcurrentChecksShareOneRequestAndUseOnlyTheProjectRepository(t *testing.T) {
	service := updates.New("v0.4.0")
	var calls atomic.Int32
	service.HTTP.Transport = transportFunc(func(request *http.Request) (*http.Response, error) {
		calls.Add(1)
		if request.URL.String() != updates.LatestAPI || request.Method != http.MethodGet || request.Header.Get("Authorization") != "" {
			t.Errorf("unexpected release request: %s %s", request.Method, request.URL)
		}
		return response(200, `{"tag_name":"v0.5.0","html_url":"https://untrusted.example/"}`), nil
	})
	var workers sync.WaitGroup
	for range 24 {
		workers.Add(1)
		go func() {
			defer workers.Done()
			snapshot, err := service.Check(context.Background())
			if err != nil || snapshot.URL != updates.Repository+"/releases/tag/v0.5.0" || snapshot.CheckedAt == "" {
				t.Errorf("invalid release result: %+v %v", snapshot, err)
			}
		}()
	}
	workers.Wait()
	if calls.Load() != 1 {
		t.Fatalf("sent %d requests", calls.Load())
	}
}
func TestGitHubFailuresAreCachedAndNeverReportedAsUpToDate(t *testing.T) {
	service := updates.New("v0.4.0")
	calls := 0
	service.HTTP.Transport = transportFunc(func(*http.Request) (*http.Response, error) {
		calls++
		return response(429, `{"message":"rate limit"}`), nil
	})
	for range 2 {
		writer := httptest.NewRecorder()
		service.Read(writer, httptest.NewRequest("GET", "/api/panel/update", nil))
		if writer.Code != http.StatusBadGateway {
			t.Fatalf("failure reported as %d", writer.Code)
		}
	}
	if calls != 1 {
		t.Fatalf("retried GitHub %d times", calls)
	}
}
func TestRedirectCannotChangeTheReleaseSource(t *testing.T) {
	service := updates.New("v0.4.0")
	calls := 0
	service.HTTP.Transport = transportFunc(func(*http.Request) (*http.Response, error) {
		calls++
		redirect := response(302, "")
		redirect.Header.Set("Location", "https://untrusted.example/releases/latest")
		return redirect, nil
	})
	if _, err := service.Check(context.Background()); err == nil || calls != 1 {
		t.Fatalf("followed release redirect: calls=%d err=%v", calls, err)
	}
}
