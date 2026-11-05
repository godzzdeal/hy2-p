package acmehttp

import (
	"gopkg.in/yaml.v3"
	"path/filepath"
)

const CorePort = 9090
const TokenPrefix = "/.well-known/acme-challenge/"

// Prepare keeps user YAML unchanged; only the generated runtime uses the local gateway.
func Prepare(document map[string]any, data string, managed bool) {
	acme, ok := document["acme"].(map[string]any)
	if !ok {
		return
	}
	if directory, _ := acme["dir"].(string); directory == "" {
		acme["dir"] = filepath.Join(data, "acme-hy2")
	}
	kind, _ := acme["type"].(string)
	if managed && (kind == "" || kind == "http") {
		acme["type"] = "http"
		acme["listenHost"] = "127.0.0.1"
		options, ok := acme["http"].(map[string]any)
		if !ok {
			options = map[string]any{}
			acme["http"] = options
		}
		options["altPort"] = CorePort
	}
}
func Domains(source string) ([]string, error) {
	var document struct {
		ACME *struct {
			Type    string   `yaml:"type"`
			Domains []string `yaml:"domains"`
		} `yaml:"acme"`
	}
	if err := yaml.Unmarshal([]byte(source), &document); err != nil {
		return nil, err
	}
	if document.ACME == nil || (document.ACME.Type != "" && document.ACME.Type != "http") {
		return nil, nil
	}
	return document.ACME.Domains, nil
}
