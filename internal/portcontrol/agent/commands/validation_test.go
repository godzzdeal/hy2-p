package commands

import (
	"strings"
	"testing"
)

func TestRejectUnsafeCommandAndCommit(t *testing.T) {
	for _, value := range []string{"../../x", strings.Repeat("a", 40) + "/x", "main"} {
		if ValidCommit(value) {
			t.Fatal("unsafe commit", value)
		}
	}
	for _, value := range []string{"stop", "sh", "restart;whoami", "exec"} {
		if ValidCommand(value) {
			t.Fatal("unsafe command", value)
		}
	}
}
func TestMaintenanceArgumentsAreRestricted(t *testing.T) {
	for _, args := range [][]string{{"update"}, {"update", "main"}, {"update", "https://example.com"}, {"update", "v0.7.5", "extra"}, {"rollback"}, {"rollback", "--no"}} {
		if ValidArguments(args) {
			t.Fatal("unsafe arguments accepted", args)
		}
	}
	for _, args := range [][]string{{"update", "v0.7.5"}, {"rollback", "--yes"}} {
		if !ValidArguments(args) {
			t.Fatal("valid maintenance arguments rejected", args)
		}
	}
}
