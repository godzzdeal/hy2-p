package model

import (
	"hy2-panel/internal/configuration"
	"time"

	"hy2-panel/internal/groups"

	"hy2-panel/internal/traffic"
	"hy2-panel/internal/useraccess"
)

const Format = "hy2-p/1"
const ExcludeProfile = "skip"
const MaxUsers = 10000
const MaxBytes = 16 << 20
const OperationTimeout = 5 * time.Minute

type Profile struct {
	ID       string                 `json:"id"`
	Name     string                 `json:"name"`
	Settings configuration.Settings `json:"settings"`
}
type User struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Password    string            `json:"password"`
	Token       string            `json:"token"`
	Enabled     bool              `json:"enabled"`
	Expires     string            `json:"expires"`
	Created     string            `json:"created"`
	Group       string            `json:"group"`
	Access      useraccess.Policy `json:"access"`
	Usage       traffic.Usage     `json:"usage"`
	DeviceLimit int               `json:"deviceLimit"`
}
type Bundle struct {
	Targets  map[string]string `json:"targets,omitempty"`
	Format   string            `json:"format"`
	Profiles []Profile         `json:"profiles"`
	Groups   []groups.Group    `json:"groups"`
	Users    []User            `json:"users"`
}
type Row struct {
	Target string `json:"target,omitempty"`
	Kind   string `json:"kind"`
	ID     string `json:"id"`
	Name   string `json:"name"`
	Action string `json:"action"`
	Reason string `json:"reason"`
}
type Preview struct {
	Rows        []Row  `json:"rows"`
	Fingerprint string `json:"fingerprint"`
}
