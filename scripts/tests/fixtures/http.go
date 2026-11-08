package main

import (
	"context"
	"errors"
	"net/http"
	"time"
)

func serveHTTP(ctx context.Context, address, directory string) error {
	server := &http.Server{Addr: address, Handler: http.FileServer(http.Dir(directory)), ReadHeaderTimeout: 5 * time.Second}
	result := make(chan error, 1)
	go func() { result <- server.ListenAndServe() }()
	select {
	case err := <-result:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		return server.Close()
	}
}
