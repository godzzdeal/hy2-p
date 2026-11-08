package attempts

import "time"

const (
	maxAttempts   = 5
	maxAddresses  = 10000
	attemptWindow = time.Minute
)

type history struct {
	timestamps [maxAttempts]time.Time
	count      int
}

func (entry history) hasRecent(now time.Time) bool {
	for index := 0; index < entry.count; index++ {
		if now.Sub(entry.timestamps[index]) < attemptWindow {
			return true
		}
	}
	return false
}
