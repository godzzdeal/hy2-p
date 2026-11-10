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
	for _, value := range []string{"stop", "sh", "restart;whoami", "update"} {
		if ValidCommand(value) {
			t.Fatal("unsafe command", value)
		}
	}
}
