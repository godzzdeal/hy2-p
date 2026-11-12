package mimic_test

import (
	"context"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/mimic"
	"strings"
	"testing"
)

func TestAssignedMimicInstanceCannotLoseItsPublishedPorts(t *testing.T) {
	t.Setenv(mimic.EnabledEnv, "true")
	t.Setenv(mimic.InstanceEnv, "0123456789abcdef")
	registry := &instances.Registry{}
	_, err := registry.Remove(context.Background(), "0123456789abcdef")
	if err == nil || !strings.Contains(err.Error(), "Mimic") {
		t.Fatalf("assigned instance removal not blocked: %v", err)
	}
}

func TestMimicKernelAndCoreVersionBounds(t *testing.T) {
	for version, want := range map[string]bool{"5.15.0": false, "6.0.12": false, "6.1.0-generic": true, "6.8.0-azure": true, "7.0.1": true, "invalid": false} {
		if got := mimic.SupportedKernel(version); got != want {
			t.Fatalf("kernel %s: %v", version, got)
		}
	}
	for version, want := range map[string]bool{"app/v2.12.3": false, "v2.13.0": true, "app/v2.14.0": true, "unknown": false} {
		status := mimic.Status{Ready: true}
		status.CheckVersion(version)
		if status.Ready != want {
			t.Fatalf("core %s: %+v", version, status)
		}
	}
}

func TestMimicDockerModeIsAssignedToExactlyOneInstance(t *testing.T) {
	t.Setenv("PANEL_CONTAINER", "true")
	t.Setenv(mimic.EnabledEnv, "true")
	t.Setenv(mimic.InstanceEnv, "default")
	status := mimic.Inspect(mimic.Config{Path: "/tmp/untrusted-program"}, "0123456789abcdef")
	for _, id := range []string{"instance", "path"} {
		found := false
		for _, check := range status.Checks {
			if check.ID == id {
				found = true
				if check.OK {
					t.Fatalf("%s unexpectedly passed", id)
				}
			}
		}
		if !found {
			t.Fatalf("missing %s check", id)
		}
	}
	if status.Ready {
		t.Fatal("unassigned instance marked ready")
	}
}
