package firewall_test

import (
	"context"
	"fmt"
	"hy2-panel/internal/firewall"
	"slices"
	"strings"
	"testing"
)

func TestOnlyExactGlobalRulesAreReplacedInDescendingOrder(t *testing.T) {
	fixture := setup(t)
	fixture.output = func(_ string, args []string) (string, error) {
		if slices.Contains(args, "numbered") {
			return "[ 1] 8088/tcp ALLOW IN Anywhere # old\n[ 2] 8088/tcp ALLOW IN 198.51.100.0/24\n[ 4] 8088/tcp (v6) DENY IN Anywhere (v6) # HY2-P\n[ 5] 9000/tcp ALLOW IN Anywhere\n", nil
		}
		return "Status: active", nil
	}
	if _, err := fixture.service.Change(context.Background(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err != nil {
		t.Fatal(err)
	}
	deleted := []string{}
	inserted := false
	for _, call := range fixture.calls {
		if slices.Contains(call.args, "delete") {
			deleted = append(deleted, call.args[len(call.args)-1])
		}
		if slices.Equal(call.args, []string{"insert", "1", "allow", "8088/tcp", "comment", "HY2-P"}) {
			inserted = true
		}
	}
	if !slices.Equal(deleted, []string{"4", "1"}) || !inserted {
		t.Fatal(fixture.calls)
	}
}
func TestExcessRulesAreRejectedBeforeMutation(t *testing.T) {
	fixture := setup(t)
	fixture.output = func(_ string, args []string) (string, error) {
		if slices.Contains(args, "numbered") {
			lines := []string{}
			for index := 1; index <= 17; index++ {
				lines = append(lines, fmt.Sprintf("[ %d] 8088/tcp ALLOW IN Anywhere", index))
			}
			return strings.Join(lines, "\n"), nil
		}
		return "Status: active", nil
	}
	if _, err := fixture.service.Change(context.Background(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err == nil {
		t.Fatal("unbounded mutation accepted")
	}
	for _, call := range fixture.calls {
		if slices.Contains(call.args, "delete") || slices.Contains(call.args, "insert") {
			t.Fatal("mutated excess rules")
		}
	}
}
