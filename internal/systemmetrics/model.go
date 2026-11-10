package systemmetrics

import (
	"hy2-panel/internal/systemmetrics/disk"
	"sync"
	"time"
)

const SampleInterval = 3 * time.Second
const StorageInterval = time.Minute
const HistoryWindow = 10 * time.Minute
const HistorySize = int(HistoryWindow / SampleInterval)
const ScanTimeout = 15 * time.Second

type Sample struct {
	Time     int64   `json:"time"`
	CPU      float64 `json:"cpu"`
	Memory   float64 `json:"memory"`
	Load     float64 `json:"load"`
	Receive  float64 `json:"receive"`
	Transmit float64 `json:"transmit"`
}
type Storage = disk.Usage
type Snapshot struct {
	Available   bool     `json:"available"`
	Scope       string   `json:"scope"`
	CPUs        int      `json:"cpus"`
	Uptime      float64  `json:"uptime"`
	MemoryTotal uint64   `json:"memoryTotal"`
	MemoryUsed  uint64   `json:"memoryUsed"`
	Received    uint64   `json:"received"`
	Transmitted uint64   `json:"transmitted"`
	Samples     []Sample `json:"samples"`
	Storage     Storage  `json:"storage"`
	Error       string   `json:"error,omitempty"`
}
type Options struct{ Proc, Data, Root, Scope string }
type counters struct {
	total, idle, received, transmitted uint64
	at                                 time.Time
}
type Service struct {
	mu        sync.RWMutex
	storageMu sync.Mutex
	options   Options
	previous  counters
	snapshot  Snapshot
}
