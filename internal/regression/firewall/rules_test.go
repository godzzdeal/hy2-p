package firewall_test

import (
	"context"
	"errors"
	"fmt"
	"hy2-panel/internal/firewall"
	"slices"
	"strings"
	"testing"
)

func TestOnlyExactGlobalRulesAreReplacedInDescendingOrder(t *testing.T) {
	fixture := setup(t)
	inserted := false
	fixture.output = func(_ string, args []string) (string, error) {
		if slices.Contains(args, "insert") {
			inserted = true
		}
		if slices.Contains(args, "numbered") {
			if inserted {
				return "[ 1] 8088/tcp ALLOW IN Anywhere # HY2-P\n[ 2] 8088/tcp ALLOW IN Anywhere # old\n[ 3] 8088/tcp ALLOW IN 198.51.100.0/24\n[ 4] 9000/tcp ALLOW IN Anywhere\n[ 5] 8088/tcp (v6) ALLOW IN Anywhere (v6)\n[ 6] 8088/tcp (v6) DENY IN Anywhere (v6) # old\n", nil
			}
			return "[ 1] 8088/tcp ALLOW IN Anywhere # old\n[ 2] 8088/tcp ALLOW IN 198.51.100.0/24\n[ 4] 8088/tcp (v6) DENY IN Anywhere (v6) # HY2-P\n[ 5] 9000/tcp ALLOW IN Anywhere\n", nil
		}
		return "Status: active", nil
	}
	if _, err := fixture.service.Change(context.Background(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err != nil {
		t.Fatal(err)
	}
	deleted := []string{}
	seenInsert := false
	for _, call := range fixture.calls {
		if slices.Contains(call.args, "delete") {
			if !seenInsert {
				t.Fatal("deleted protection before replacement")
			}
			deleted = append(deleted, call.args[len(call.args)-1])
		}
		if slices.Equal(call.args, []string{"insert", "1", "allow", "8088/tcp", "comment", "HY2-P"}) {
			seenInsert = true
		}
	}
	if !slices.Equal(deleted, []string{"6"}) || !seenInsert {
		t.Fatal(fixture.calls)
	}
}

func TestReplacementFailuresPreserveExistingRules(t *testing.T) {
	for _, stage := range []string{"insert", "refresh"} {
		t.Run(stage, func(t *testing.T) {
			fixture := setup(t)
			inserted := false
			fixture.output = func(_ string, args []string) (string, error) {
				if slices.Contains(args, "insert") {
					inserted = true
					if stage == "insert" {
						return "", errors.New("injected insertion failure")
					}
				}
				if slices.Contains(args, "numbered") {
					if inserted {
						return "", errors.New("injected refresh failure")
					}
					return "[ 1] 8088/tcp DENY IN Anywhere\n", nil
				}
				return "Status: active", nil
			}
			if _, err := fixture.service.Change(t.Context(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err == nil {
				t.Fatal("replacement failure not reported")
			}
			for _, call := range fixture.calls {
				if slices.Contains(call.args, "delete") {
					t.Fatal("old protection deleted after replacement failure")
				}
			}
		})
	}
}

func TestExistingEquivalentRuleIsKeptWhenUFWDoesNotInsertDuplicate(t *testing.T) {
	fixture := setup(t)
	fixture.output = func(_ string, args []string) (string, error) {
		if slices.Contains(args, "numbered") {
			return "[ 1] 8088/tcp DENY IN Anywhere\n[ 2] 8088/tcp ALLOW IN Anywhere # existing\n[ 3] 8088/tcp (v6) ALLOW IN Anywhere (v6)\n[ 4] 8088/tcp (v6) DENY IN Anywhere (v6)\n", nil
		}
		return "Status: active", nil
	}
	if _, err := fixture.service.Change(t.Context(), firewall.Change{Port: 8088, Protocol: "tcp", Action: "allow"}); err != nil {
		t.Fatal(err)
	}
	deleted := []string{}
	for _, call := range fixture.calls {
		if slices.Contains(call.args, "delete") {
			deleted = append(deleted, call.args[len(call.args)-1])
		}
	}
	if !slices.Equal(deleted, []string{"4", "1"}) {
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
