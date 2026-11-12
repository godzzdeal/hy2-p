package mimic_test

import (
	"context"
	"errors"
	"hy2-panel/internal/mimic"
	"testing"
)

func TestDisabledMimicDoesNotProbeBinaryOrChangeConfiguration(t *testing.T) {
	document := map[string]any{"listen": ":8443", "mimic": map[string]any{"enabled": false, "xdpMode": "skb"}}
	calls := 0
	err := mimic.CheckRuntime(document, "default", "fixture", func(context.Context, string) (string, error) { calls++; return "", errors.New("must not run") })
	if err != nil || calls != 0 {
		t.Fatalf("disabled: %v calls=%d", err, calls)
	}
	if _, exists := document["mimic"].(map[string]any)["path"]; exists {
		t.Fatal("disabled config was modified")
	}
}

func TestEnabledMimicFailsClosedWhenCoreCannotBeChecked(t *testing.T) {
	expected := errors.New("fixture version probe failed")
	document := map[string]any{"listen": ":8443", "mimic": map[string]any{"enabled": true}}
	err := mimic.CheckRuntime(document, "default", "fixture", func(context.Context, string) (string, error) { return "", expected })
	if !errors.Is(err, expected) {
		t.Fatalf("probe failure ignored: %v", err)
	}
}
