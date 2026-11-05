package core

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os/exec"
	"time"
)

func (handler *Handler) TryLock() bool { return handler.controlMu.TryLock() }
func (handler *Handler) Unlock()       { handler.controlMu.Unlock() }
func (handler *Handler) Running() bool {
	handler.mu.Lock()
	defer handler.mu.Unlock()
	return handler.core != nil
}
func (handler *Handler) Probe(ctx context.Context, path string) (string, error) {
	probeContext, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	output, err := exec.CommandContext(probeContext, path, "version").CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("проверка бинарного файла: %w", err)
	}
	version := versionExpression.FindString(string(output))
	if version == "" {
		return "", errors.New("бинарный файл не сообщил версию Hysteria2")
	}
	if version[:4] != "app/" {
		version = "app/" + version
	}
	return version, nil
}
func (handler *Handler) Activate(ctx context.Context, path string, run bool) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := handler.stop(); err != nil {
		return err
	}
	handler.mu.Lock()
	handler.Binary = path
	handler.mu.Unlock()
	if !run {
		return nil
	}
	if err := handler.start(); err != nil {
		return err
	}
	ticker := time.NewTicker(HealthPoll)
	defer ticker.Stop()
	started := time.Now()
	client := http.Client{Timeout: HealthRequestTimeout}
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
		if !handler.Running() {
			return errors.New("новое ядро завершилось во время проверки")
		}
		request, err := http.NewRequestWithContext(ctx, "GET", "http://127.0.0.1:9999/online", nil)
		if err != nil {
			return err
		}
		request.Header.Set("Authorization", handler.Secret)
		response, err := client.Do(request)
		if err != nil {
			continue
		}
		healthy := response.StatusCode == http.StatusOK
		response.Body.Close()
		if healthy && time.Since(started) >= HealthWindow && handler.Running() {
			return nil
		}
	}
}

func (handler *Handler) Version() string { return handler.Updates.Current().Version }
func (handler *Handler) Restart(ctx context.Context) error {
	handler.mu.Lock()
	path := handler.Binary
	handler.mu.Unlock()
	err := handler.Activate(ctx, path, true)
	if err != nil {
		return errors.Join(err, handler.stop())
	}
	return nil
}
func (handler *Handler) Recover(ctx context.Context) error { return handler.Updates.RecoverLocked(ctx) }

func (handler *Handler) Generation() string {
	handler.mu.Lock()
	defer handler.mu.Unlock()
	return handler.generation
}
