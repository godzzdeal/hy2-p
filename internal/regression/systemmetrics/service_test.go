package systemmetrics_test

import (
	"context"
	"hy2-panel/internal/systemmetrics"
	"testing"
	"time"
)

func TestSamplingUpdatesAndStopsWithItsOwner(t *testing.T) {
	root := fixture(t)
	service := systemmetrics.New(systemmetrics.Options{Proc: root, Data: t.TempDir()})
	if value := service.Snapshot(); !value.Available || len(value.Samples) != 1 || value.Samples[0].CPU != 0 {
		t.Fatalf("first sample: %+v", value)
	}
	write(t, root, "stat", "cpu 200 20 30 500 50 10 20 30\ncpu0 0\ncpu1 0\n")
	write(t, root, "net/dev", "eth0: 1100 0 0 0 0 0 0 0 2200\n")
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	done := make(chan struct{})
	go func() { service.Run(ctx); close(done) }()
	deadline := time.After(2 * systemmetrics.SampleInterval)
	for len(service.Snapshot().Samples) < 2 {
		select {
		case <-deadline:
			t.Fatal("no second sample")
		case <-time.After(20 * time.Millisecond):
		}
	}
	value := service.Snapshot()
	last := value.Samples[len(value.Samples)-1]
	if last.CPU != 50 || last.Receive <= 0 || last.Transmit <= 0 {
		t.Fatalf("delta counters: %+v", last)
	}
	value.Samples[0].CPU = 999
	if service.Snapshot().Samples[0].CPU == 999 {
		t.Fatal("snapshot aliases internal history")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("sampler outlived cancellation")
	}
}
func TestMissingProcReturnsUnavailableWithoutFakeZeros(t *testing.T) {
	service := systemmetrics.New(systemmetrics.Options{Proc: t.TempDir()})
	value := service.Snapshot()
	if value.Available || value.Error == "" || len(value.Samples) != 0 {
		t.Fatalf("unexpected unavailable state: %+v", value)
	}
}
