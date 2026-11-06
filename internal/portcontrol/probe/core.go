package probe

import (
	"context"
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/portcontrol/protocol"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

func Core(data string) error {
	directories := []string{data}
	children, err := filepath.Glob(filepath.Join(data, "instances", "*"))
	if err != nil {
		return err
	}
	for _, directory := range children {
		if protocol.InstancePattern.MatchString(filepath.Base(directory)) {
			directories = append(directories, directory)
		}
	}
	var workers sync.WaitGroup
	var failures []error
	var mu sync.Mutex
	for _, directory := range directories {
		wanted, err := supervision.ReadIntent(directory)
		if err != nil {
			return err
		}
		if !wanted {
			continue
		}
		workers.Add(1)
		go func(directory string) {
			defer workers.Done()
			if err := oneCore(directory); err != nil {
				mu.Lock()
				failures = append(failures, err)
				mu.Unlock()
			}
		}(directory)
	}
	workers.Wait()
	return errors.Join(failures...)
}
func oneCore(data string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	client := http.Client{Timeout: time.Second}
	stable := time.Time{}
	for ctx.Err() == nil {
		payload, err := os.ReadFile(filepath.Join(data, "runtime.yaml"))
		var config struct {
			Stats struct {
				Secret string `yaml:"secret"`
				Listen string `yaml:"listen"`
			} `yaml:"trafficStats"`
		}
		if err == nil {
			err = yaml.Unmarshal(payload, &config)
		}
		healthy := false
		host, _, addressError := net.SplitHostPort(config.Stats.Listen)
		if err == nil && addressError == nil && host == "127.0.0.1" && config.Stats.Secret != "" {
			request, _ := http.NewRequestWithContext(ctx, "GET", "http://"+config.Stats.Listen+"/online", nil)
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
