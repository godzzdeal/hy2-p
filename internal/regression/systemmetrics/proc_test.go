package systemmetrics_test

import (
	"hy2-panel/internal/systemmetrics/proc"
	"os"
	"path/filepath"
	"testing"
)

func fixture(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	files := map[string]string{
		"stat":    "cpu 100 20 30 400 50 10 20 30 100 200\ncpu0 0\ncpu1 0\n",
		"meminfo": "MemTotal: 1024 kB\nMemAvailable: 256 kB\n",
		"loadavg": "1.25 0.8 0.5 1/100 1\n", "uptime": "120.5 200\n",
		"net/dev": "eth0: 100 0 0 0 0 0 0 0 200\nlo: 1000 0 0 0 0 0 0 0 2000\nveth123: 1000 0 0 0 0 0 0 0 2000\ndocker0: 1000 0 0 0 0 0 0 0 2000\n",
	}
	for path, value := range files {
		write(t, root, path, value)
	}
	return root
}
func write(t *testing.T, root, path, value string) {
	t.Helper()
	target := filepath.Join(root, path)
	if err := os.MkdirAll(filepath.Dir(target), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(target, []byte(value), 0600); err != nil {
		t.Fatal(err)
	}
}
func TestKernelCountersExcludeGuestCPUAndDockerTraffic(t *testing.T) {
	value, err := proc.Read(fixture(t))
	if err != nil {
		t.Fatal(err)
	}
	if value.Total != 660 || value.Idle != 450 || value.CPUs != 2 || value.MemoryUsed != 768*1024 || value.Received != 100 || value.Transmitted != 200 || value.Load != 1.25 {
		t.Fatalf("unexpected counters: %+v", value)
	}
}
func TestKernelCountersRejectNonFiniteLoad(t *testing.T) {
	root := fixture(t)
	for _, value := range []string{"NaN", "+Inf", "-1", "bad"} {
		write(t, root, "loadavg", value)
		if _, err := proc.Read(root); err == nil {
			t.Fatal("accepted invalid load", value)
		}
	}
}
