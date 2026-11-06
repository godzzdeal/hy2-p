package probe

import (
	"context"
	"errors"
	"gopkg.in/yaml.v3"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func Core(data string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	client := http.Client{Timeout: time.Second}
	stable := time.Time{}
	for ctx.Err() == nil {
		payload, err := os.ReadFile(filepath.Join(data, "runtime.yaml"))
		var config struct {
			Stats struct {
				Secret string `yaml:"secret"`
			} `yaml:"trafficStats"`
		}
		if err == nil {
			err = yaml.Unmarshal(payload, &config)
		}
		healthy := false
		if err == nil && config.Stats.Secret != "" {
			request, _ := http.NewRequestWithContext(ctx, "GET", "http://127.0.0.1:9999/online", nil)
			request.Header.Set("Authorization", config.Stats.Secret)
			response, err := client.Do(request)
			if err == nil {
				healthy = response.StatusCode == 200
				response.Body.Close()
			}
		}
		if healthy {
			if stable.IsZero() {
				stable = time.Now()
			}
			if time.Since(stable) >= 3*time.Second {
				return nil
			}
		} else {
			stable = time.Time{}
		}
		select {
		case <-ctx.Done():
		case <-time.After(250 * time.Millisecond):
		}
	}
	return errors.New("ядро не прошло проверку после смены UDP-порта")
}
