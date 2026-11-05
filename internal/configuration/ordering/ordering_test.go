package ordering

import (
	"gopkg.in/yaml.v3"
	"strings"
	"testing"
)

func TestRuntimeOrderAndSequencePreservation(t *testing.T) {
	value := map[string]any{
		"auth":      map[string]any{"password": "fixture", "type": "password"},
		"listen":    ":443",
		"obfs":      map[string]any{"type": "salamander"},
		"outbounds": []any{map[string]any{"name": "second"}, map[string]any{"name": "first"}},
	}
	payload, err := Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	result := string(payload)
	if strings.Index(result, "listen:") > strings.Index(result, "obfs:") ||
		strings.Index(result, "obfs:") > strings.Index(result, "auth:") {
		t.Fatal(result)
	}
	var decoded map[string]any
	if err := yaml.Unmarshal(payload, &decoded); err != nil {
		t.Fatal(err)
	}
	outbounds := decoded["outbounds"].([]any)
	if outbounds[0].(map[string]any)["name"] != "second" {
		t.Fatal("sequence reordered")
	}
}
