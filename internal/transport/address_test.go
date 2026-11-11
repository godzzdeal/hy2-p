package transport

import "testing"

func TestInternalAddressStaysOnLoopback(t *testing.T) {
	for _, entry := range []struct{ value, expected string }{
		{"", "127.0.0.1:8081"}, {"18081", "127.0.0.1:18081"},
		{"0", "127.0.0.1:8081"}, {"65536", "127.0.0.1:8081"},
		{"0.0.0.0:8081", "127.0.0.1:8081"},
	} {
		t.Setenv("PANEL_INTERNAL_PORT", entry.value)
		if value := InternalAddress(); value != entry.expected {
			t.Fatalf("%s: %s", entry.value, value)
		}
	}
}
