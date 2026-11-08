package challenge

import "time"

const (
	Capacity    = 1024
	MaxAttempts = 5
	Lifetime    = 2 * time.Minute
)

type entry struct {
	ip       string
	epoch    uint64
	expires  time.Time
	attempts int
}
