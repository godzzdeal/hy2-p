package challenge

import (
	"strconv"
	"testing"
	"time"
)

func TestBindingExpiryAttemptsAndSingleUse(t *testing.T) {
	store := New()
	now := time.Unix(100, 0)
	token, _ := store.Issue("first", 9, now)
	if _, valid := store.Begin(token, "other", now); valid {
		t.Fatal("challenge accepted another IP")
	}
	for index := 0; index < MaxAttempts; index++ {
		if epoch, valid := store.Begin(token, "first", now); !valid || epoch != 9 {
			t.Fatal("attempt rejected too early")
		}
	}
	if _, valid := store.Begin(token, "first", now); valid {
		t.Fatal("attempt budget exceeded")
	}
	token, _ = store.Issue("first", 9, now)
	if !store.Consume(token, "first", now) || store.Consume(token, "first", now) {
		t.Fatal("challenge replay")
	}
	token, _ = store.Issue("first", 9, now)
	if _, valid := store.Begin(token, "first", now.Add(Lifetime)); valid {
		t.Fatal("expired challenge accepted")
	}
}

func TestBoundedCapacityAndClear(t *testing.T) {
	store := New()
	now := time.Unix(100, 0)
	for index := 0; index < Capacity; index++ {
		if _, valid := store.Issue(strconv.Itoa(index), 0, now); !valid {
			t.Fatal("capacity too small")
		}
	}
	if _, valid := store.Issue("extra", 0, now); valid || len(store.entries) != Capacity {
		t.Fatal("unbounded challenges")
	}
	if _, valid := store.Issue("extra", 0, now.Add(Lifetime)); !valid {
		t.Fatal("expired entries not reclaimed")
	}
	store.Clear()
	if len(store.entries) != 0 {
		t.Fatal("clear retained entries")
	}
}
