package mimic

import (
	"context"
	"errors"
	"gopkg.in/yaml.v3"
	"os"
	"strconv"
	"strings"
)

func CheckRuntime(document map[string]any, instance, binary string, probe func(context.Context, string) (string, error)) error {
	payload, err := yaml.Marshal(document)
	if err != nil {
		return err
	}
	if err = ValidateSource(string(payload)); err != nil {
		return err
	}
	config, err := Parse(string(payload))
	if err != nil || !config.Enabled {
		return err
	}
	version, err := probe(context.Background(), binary)
	if err != nil {
		return err
	}
	status := Inspect(config, instance)
	status.CheckVersion(version)
	for _, check := range status.Checks {
		if !check.OK {
			return errors.New(check.Detail)
		}
	}
	if os.Getenv("PANEL_CONTAINER") == "true" {
		// A fixed bundled executable keeps the optional container permissions scoped to Mimic.
		document["mimic"].(map[string]any)["path"] = Binary
	}
	return nil
}

func (status *Status) CheckVersion(version string) {
	const minimumMinor = 13
	parts := strings.Split(strings.TrimPrefix(strings.TrimPrefix(version, "app/"), "v"), ".")
	supported := false
	if len(parts) == 3 {
		major, majorError := strconv.Atoi(parts[0])
		minor, minorError := strconv.Atoi(parts[1])
		supported = majorError == nil && minorError == nil && (major > 2 || major == 2 && minor >= minimumMinor)
	}
	status.add("version", supported, "Нужна Hysteria2 версии 2.13.0 или новее")
}
