package server

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestBackgroundWaitsForCancellationCleanup(t *testing.T) {
	started := make(chan struct{})
	finished := make(chan struct{})
	stop := background(t.Context(), func(ctx context.Context) {
		close(started)
		<-ctx.Done()
		close(finished)
	})
	<-started
	stop()
	select {
	case <-finished:
	default:
		t.Fatal("background work outlived shutdown")
	}
	stop()
}

func TestShutdownClosesActiveConnectionsAfterDeadline(t *testing.T) {
	started := make(chan struct{})
	finished := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		close(started)
		<-request.Context().Done()
		close(finished)
	}))
	defer server.Close()
	clientDone := make(chan struct{})
	go func() {
		defer close(clientDone)
		response, err := server.Client().Get(server.URL)
		if err == nil {
			response.Body.Close()
		}
	}()
	<-started
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	if err := shutdownServers(ctx, []*http.Server{server.Config}); !errors.Is(err, context.Canceled) {
		t.Fatalf("missing shutdown failure: %v", err)
	}
	select {
	case <-finished:
	case <-time.After(time.Second):
		t.Fatal("active connection was not closed after graceful shutdown failed")
	}
	<-clientDone
}

func TestShutdownClosesAllIdleListeners(t *testing.T) {
	first := httptest.NewServer(http.NotFoundHandler())
	defer first.Close()
	second := httptest.NewServer(http.NotFoundHandler())
	defer second.Close()
	if err := shutdownServers(t.Context(), []*http.Server{first.Config, second.Config}); err != nil {
		t.Fatal(err)
	}
	for _, server := range []*httptest.Server{first, second} {
		if response, err := server.Client().Get(server.URL); err == nil {
			response.Body.Close()
			t.Fatal("shutdown left a listener accepting connections")
		}
	}
}
