package mimic_test

import (
	"hy2-panel/internal/mimic"
	"strings"
	"testing"
)

func TestMimicConfigurationMatchesDocumentedFields(t *testing.T) {
	source := "listen: :8443\nmimic:\n  enabled: true\n  interface: eth0\n  xdpMode: skb\n  path: /usr/local/bin/mimic\n  extraArgs: [--padding=random, --max-window]\n"
	config, err := mimic.Parse(source)
	if err != nil || !config.Enabled || config.Interface != "eth0" || config.XDPMode != "skb" || len(config.ExtraArgs) != 2 {
		t.Fatalf("config: %+v %v", config, err)
	}
	if err = mimic.ValidateSource(source); err != nil {
		t.Fatal(err)
	}
	for _, invalid := range []string{
		strings.Replace(source, ":8443", ":8443-8450", 1),
		strings.Replace(source, "eth0", "eth0\"bad", 1),
		strings.Replace(source, "skb", "unsupported", 1),
		"mimic: invalid\n",
	} {
		if mimic.ValidateSource(invalid) == nil {
			t.Fatalf("invalid config accepted: %s", invalid)
		}
	}
}

func TestMimicArgumentsCannotContainControlCharacters(t *testing.T) {
	for _, argument := range []string{"--padding=0\n--file=/etc/shadow", "bad\x00value", strings.Repeat("x", mimic.MaxArgumentLength+1)} {
		if mimic.Validate(mimic.Config{ExtraArgs: []string{argument}}) == nil {
			t.Fatalf("invalid argument accepted: %q", argument)
		}
	}
	if mimic.Validate(mimic.Config{ExtraArgs: make([]string, mimic.MaxArguments+1)}) == nil {
		t.Fatal("too many arguments accepted")
	}
}
