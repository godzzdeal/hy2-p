package planning

import (
	"hy2-panel/internal/transfer/importing"
	"hy2-panel/internal/transfer/model"
	"hy2-panel/internal/useraccess"
	"testing"
)

func TestExcludedReferencesAreRemovedWhileFailedImportsStillBlockAccess(t *testing.T) {
	mapping := map[string]string{"default": "existing", "excluded": ""}
	for _, policy := range []useraccess.Policy{useraccess.Default(), {Mode: useraccess.Selected, Instances: []string{"default", "excluded"}}} {
		access, ok := importing.Access(policy, mapping)
		if !ok || len(access.Instances) != 1 || access.Instances[0] != "existing" {
			t.Fatal("exclusion lost permitted access", access)
		}
	}
	if _, ok := importing.Access(useraccess.Policy{Mode: useraccess.Selected, Instances: []string{"failed"}}, mapping); ok {
		t.Fatal("failed import treated as an explicit exclusion")
	}
	if model.ExcludeProfile == "default" {
		t.Fatal("excluded marker collides with a real identifier")
	}
}
