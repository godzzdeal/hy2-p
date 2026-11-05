package deployment

import (
	"encoding/json"
	"fmt"
	"hy2-panel/internal/configuration"
	"strings"
	"testing"
)

func TestCustomAndTranslatedUDPPorts(t *testing.T) {
	for _, test := range []struct {
		listen, public, target string
		restart                bool
	}{
		{":61254", "61254", "61254", false},
		{":61254", "8443", "8443", true},
		{":61254", "61255", "61254", false},
		{"[::]:61254", "61254", "61254", false},
	} {
		desired := test.public
		if test.restart {
			desired = "61254"
		}
		value, err := Inspect(configuration.Settings{Port: desired, Config: fmt.Sprintf("listen: %q", test.listen)}, true, test.public, test.target)
		if err != nil || value.UDPListenPort != "61254" || value.UDPRestartRequired != test.restart {
			t.Fatalf("%+v: %+v %v", test, value, err)
		}
	}
}
func TestDefaultAndUnsupportedListeners(t *testing.T) {
	result, err := Inspect(configuration.Settings{Port: "443", Config: "auth: {type: password}"}, true, "443", "443")
	if err != nil || result.UDPListenPort != "443" || result.UDPRestartRequired {
		t.Fatalf("%+v %v", result, err)
	}
	for _, listen := range []string{":0", ":65536", ":443-444", "realm://example.invalid/test"} {
		result, err = Inspect(configuration.Settings{Port: "8443", Config: "listen: " + listen}, true, "8443", "8443")
		if err != nil || result.UDPListenPort != "" || result.UDPWarning == "" {
			t.Fatalf("%s: %+v %v", listen, result, err)
		}
	}
}
func TestPrivateMetadataAndLoopbackWarning(t *testing.T) {
	config := configuration.Settings{Port: "61254", Config: "listen: 127.0.0.1:61254\nauth: {password: private-fixture-secret}"}
	result, err := Inspect(config, true, "61254", "61254")
	if err != nil || result.UDPWarning == "" {
		t.Fatalf("%+v %v", result, err)
	}
	data, err := json.Marshal(result)
	if err != nil || strings.Contains(string(data), "private-fixture-secret") {
		t.Fatal("credential disclosure")
	}
}
