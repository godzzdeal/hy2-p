package devices_test

import (
	"fmt"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/devices"
	"hy2-panel/internal/records"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
)

func TestConcurrentEnrollmentCannotExceedLimit(t *testing.T) {
	data := t.TempDir()
	vault, err := cryptovault.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	store, err := devices.Open(data, vault)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.SetLimit("user", 1); err != nil {
		t.Fatal(err)
	}
	var admitted atomic.Int32
	var workers sync.WaitGroup
	for index := range 16 {
		workers.Add(1)
		go func(index int) {
			defer workers.Done()
			request := httptest.NewRequest("GET", "http://example.org", nil)
			request.Header.Set("x-hwid", fmt.Sprintf("device-%016d", index))
			if _, err := store.Admit("user", "parent-password", request); err == nil {
				admitted.Add(1)
			}
		}(index)
	}
	workers.Wait()
	if admitted.Load() != 1 || len(store.Snapshot("user").Devices) != 1 {
		t.Fatal("limit raced", admitted.Load())
	}
	loaded, err := devices.Open(data, vault)
	if err != nil || loaded.Limit("user") != 1 || len(loaded.Snapshot("user").Devices) != 1 {
		t.Fatal("device registry not restored", err)
	}
}
func TestDeviceCredentialsAndHardwareIDAreProtectedAtRest(t *testing.T) {
	data := t.TempDir()
	vault, err := cryptovault.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	store, err := devices.Open(data, vault)
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("GET", "http://example.org", nil)
	request.Header.Set("x-hwid", "private-device-identifier")
	password, err := store.Admit("user", "private-parent-password", request)
	if err != nil {
		t.Fatal(err)
	}
	files, _ := filepath.Glob(filepath.Join(data, "devices", "*.json"))
	for _, file := range files {
		payload, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		for _, private := range []string{password, "private-parent-password", "private-device-identifier"} {
			if strings.Contains(string(payload), private) {
				t.Fatal("plaintext private data on disk")
			}
		}
	}
	reference, ok := store.Resolve(password)
	if !ok || reference.User != "user" {
		t.Fatal("lookup failed")
	}
	if err := store.SetBlocked("user", reference.Device, true); err != nil {
		t.Fatal(err)
	}
	loaded, err := devices.Open(data, vault)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := loaded.Resolve(password); ok {
		t.Fatal("blocked credential restored as active")
	}
	if err := records.Write(filepath.Join(data, "devices"), "devices", nil); err != nil {
		t.Fatal(err)
	}
	if _, err := devices.Open(data, vault); err == nil {
		t.Fatal("corrupt registry reset to unlimited")
	}
}

func TestForgettingDeviceRevokesItsCachedCredential(t *testing.T) {
	data := t.TempDir()
	vault, err := cryptovault.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	store, err := devices.Open(data, vault)
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("GET", "http://example.org", nil)
	request.Header.Set("x-hwid", "device-00000001")
	password, err := store.Admit("user", "parent-password", request)
	if err != nil {
		t.Fatal(err)
	}
	reference, _ := store.Resolve(password)
	if err := store.Remove("user", reference.Device); err != nil {
		t.Fatal(err)
	}
	if _, ok := store.Resolve(password); ok {
		t.Fatal("forgotten key still active")
	}
	next, err := store.Admit("user", "parent-password", request)
	if err != nil || next == password {
		t.Fatal("old credential reused", err)
	}
}
