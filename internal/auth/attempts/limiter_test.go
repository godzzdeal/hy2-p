package attempts

import (
	"strconv"
	"testing"
	"time"
)

func TestRejectedAttemptsRemainBoundedAndExpire(t *testing.T) {
	limiter := New()
	now := time.Unix(100, 0)
	const requests = 32
	for index := 0; index < requests; index++ {
		if allowed := limiter.Allow("dummy", now); allowed != (index < maxAttempts) {
			t.Fatalf("attempt %d: allowed=%v", index, allowed)
		}
	}
	if limiter.addresses["dummy"].count != maxAttempts || len(limiter.addresses) != 1 {
		t.Fatal("blocked requests grew stored history")
	}
	if !limiter.Allow("dummy", now.Add(attemptWindow)) {
		t.Fatal("expired history still blocks login")
	}
}

func TestAddressCapacityFailsClosedAndRecovers(t *testing.T) {
	limiter := New()
	now := time.Unix(100, 0)
	for index := 0; index < maxAddresses; index++ {
		limiter.addresses[strconv.Itoa(index)] = history{timestamps: [maxAttempts]time.Time{now}, count: 1}
	}
	limiter.cleanupAt = now.Add(attemptWindow)
	if limiter.Allow("new", now) || len(limiter.addresses) != maxAddresses {
		t.Fatal("address capacity exceeded")
	}
	if !limiter.Allow("0", now) {
		t.Fatal("existing address rejected below per-address limit")
	}
	if !limiter.Allow("new", now.Add(attemptWindow)) || len(limiter.addresses) != 1 {
		t.Fatal("expired addresses were not reclaimed")
	}
}

func TestWindowIsSliding(t *testing.T) {
	limiter := New()
	now := time.Unix(100, 0)
	for index := 0; index < maxAttempts; index++ {
		if !limiter.Allow("dummy", now.Add(time.Duration(index)*time.Second)) {
			t.Fatal("initial request rejected")
		}
	}
	if !limiter.Allow("dummy", now.Add(attemptWindow)) || limiter.Allow("dummy", now.Add(attemptWindow)) {
		t.Fatal("sliding expiry admitted more than one freed slot")
	}
}

func TestCleanupPreservesOutOfOrderAttempts(t *testing.T) {
	limiter := New()
	now := time.Unix(100, 0)
	limiter.Allow("dummy", now.Add(time.Second))
	limiter.Allow("dummy", now)
	limiter.Allow("dummy", now.Add(2*time.Second))
	limiter.Allow("dummy", now.Add(3*time.Second))
	limiter.Allow("dummy", now)
	if !limiter.Allow("other", now.Add(attemptWindow+time.Second)) {
		t.Fatal("unrelated address rejected")
	}
	if limiter.addresses["dummy"].count != maxAttempts {
		t.Fatal("cleanup discarded history containing unexpired attempts")
	}
}
