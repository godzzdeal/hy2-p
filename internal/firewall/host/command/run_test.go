package command

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"testing"
)

func TestFailureDiagnosticsAreBoundedAndKeptOutOfAPIError(t *testing.T) {
	var output bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&output)
	t.Cleanup(func() { log.SetOutput(previous) })
	process := exec.Command(os.Args[0], "-test.run=^TestDiagnosticHelper$")
	process.Env = append(os.Environ(), "HY2_FIREWALL_TEST_HELPER=1")
	_, err := run(process)
	if err == nil || strings.Contains(err.Error(), "diagnostic") {
		t.Fatalf("diagnostics exposed or error missing: %v", err)
	}
	logged := output.String()
	if !strings.Contains(logged, "firewall command failed") || !strings.Contains(logged, "fixture diagnostic") || strings.Contains(logged, "HIDDEN-TRAILER") {
		t.Fatalf("missing or unbounded diagnostics: %d bytes", len(logged))
	}
	if len(logged) > MaxDiagnostic+1024 {
		t.Fatalf("diagnostic limit exceeded: %d", len(logged))
	}
}

func TestDiagnosticHelper(t *testing.T) {
	if os.Getenv("HY2_FIREWALL_TEST_HELPER") != "1" {
		return
	}
	if _, err := fmt.Fprint(os.Stderr, "fixture diagnostic "+strings.Repeat("x", MaxDiagnostic)+"HIDDEN-TRAILER"); err != nil {
		os.Exit(3)
	}
	os.Exit(2)
}
