package sources

import (
	"net/http"
	"sync"
)

const MaxPayload = 8 << 20
const DefaultStatsPort = 9999

type Counter struct {
	TX uint64 `json:"tx"`
	RX uint64 `json:"rx"`
}
type Runtime interface {
	Running() bool
	Generation() string
}
type Source struct {
	ID, Address, Secret string
	Runtime             Runtime
}
type Sample struct {
	Source     Source
	Generation string
	Counters   map[string]Counter
	Online     map[string]int
	Err        error
}
type Result struct {
	Counters map[string]Counter
	Online   map[string]int
	Err      error
}
type Collector struct {
	mu          sync.Mutex
	client      *http.Client
	generations map[string]string
	baselines   map[string]map[string]Counter
}

func New(client *http.Client) *Collector {
	return &Collector{client: client, generations: map[string]string{}, baselines: map[string]map[string]Counter{}}
}

type Usage struct {
	GroupLimit uint64 `json:"groupLimit,omitempty"`
	Upload     uint64 `json:"upload"`
	Download   uint64 `json:"download"`
	Limit      uint64 `json:"limit"`
	Online     int    `json:"online"`
	LastSeen   string `json:"lastSeen"`
}
type Snapshot struct {
	Users     map[string]Usage `json:"users"`
	Available bool             `json:"available"`
	Updated   string           `json:"updated"`
	Error     string           `json:"error"`
}

type ManagedRuntime interface {
	Runtime
	Kick(string)
}
