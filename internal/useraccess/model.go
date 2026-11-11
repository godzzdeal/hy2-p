package useraccess

import (
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"slices"
	"sync"
)

const All = "all"
const Selected = "selected"

type Policy struct {
	Mode      string   `json:"mode"`
	Instances []string `json:"instances"`
}

func Default() Policy { return Policy{Mode: All, Instances: []string{}} }
func (policy Policy) Allows(instance string) bool {
	return policy.Mode == All || (policy.Mode == Selected && slices.Contains(policy.Instances, instance))
}
func (policy Policy) Validate() error {
	return validate(policy)
}

type Store struct {
	mu        sync.RWMutex
	directory string
	policies  map[string]Policy
}

func CallbackURL(instance string) string {
	if instance == "" {
		instance = "default"
	}
	if !protocol.InstancePattern.MatchString(instance) {
		return ""
	}
	return "http://" + transport.InternalAddress() + "/auth/" + instance
}
