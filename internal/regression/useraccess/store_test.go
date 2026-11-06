package useraccess_test

import (
	"hy2-panel/internal/records"
	"hy2-panel/internal/useraccess"
	"path/filepath"
	"sync"
	"testing"
)

func TestPoliciesPersistAndDefaultToAll(t *testing.T) {
	data := t.TempDir()
	store, err := useraccess.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	id := "aabbccddeeff0011"
	if !store.Allows(id, "default") || !store.Allows(id, "bbbbbbbbbbbbbbbb") {
		t.Fatal("legacy access changed")
	}
	policy := useraccess.Policy{Mode: useraccess.Selected, Instances: []string{"default"}}
	if err := store.Put(id, policy); err != nil {
		t.Fatal(err)
	}
	policy.Instances[0] = "cccccccccccccccc"
	if store.Allows(id, "cccccccccccccccc") {
		t.Fatal("external mutation changed permissions")
	}
	loaded, err := useraccess.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	if !loaded.Allows(id, "default") || loaded.Allows(id, "bbbbbbbbbbbbbbbb") {
		t.Fatal("policy not restored")
	}
	copy := loaded.Get(id)
	copy.Instances[0] = "dddddddddddddddd"
	if !loaded.Allows(id, "default") {
		t.Fatal("read snapshot mutable")
	}
	if err := loaded.Put(id, useraccess.Policy{Mode: useraccess.Selected}); err != nil {
		t.Fatal(err)
	}
	if loaded.Allows(id, "default") {
		t.Fatal("empty selected list allowed access")
	}
}
func TestInvalidOrCorruptPoliciesNeverGrantAccess(t *testing.T) {
	data := t.TempDir()
	store, err := useraccess.Open(data)
	if err != nil {
		t.Fatal(err)
	}
	for _, policy := range []useraccess.Policy{{Mode: "unknown"}, {Mode: useraccess.All, Instances: []string{"default"}}, {Mode: useraccess.Selected, Instances: []string{"../bad"}}, {Mode: useraccess.Selected, Instances: []string{"default", "default"}}} {
		if err := store.Put("aabbccddeeff0011", policy); err == nil {
			t.Fatal("invalid policy accepted", policy)
		}
	}
	if err := records.Write(filepath.Join(data, "user-access"), "permissions", nil); err != nil {
		t.Fatal(err)
	}
	if _, err := useraccess.Open(data); err == nil {
		t.Fatal("corrupt policy reset to unrestricted")
	}
}
func TestConcurrentPolicyReadsAndWrites(t *testing.T) {
	store, err := useraccess.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	var workers sync.WaitGroup
	for range 8 {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for range 10 {
				store.Allows("aabbccddeeff0011", "default")
				if err := store.Put("aabbccddeeff0011", useraccess.Policy{Mode: useraccess.Selected, Instances: []string{"default"}}); err != nil {
					t.Error(err)
				}
			}
		}()
	}
	workers.Wait()
}
