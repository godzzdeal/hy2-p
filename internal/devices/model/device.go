package model

type Device struct {
	ID              string `json:"id"`
	Model           string `json:"model"`
	OS              string `json:"os"`
	OSVersion       string `json:"osVersion"`
	App             string `json:"app"`
	FirstSeen       string `json:"firstSeen"`
	LastSeen        string `json:"lastSeen"`
	SubscriptionIP  string `json:"subscriptionIp"`
	LastConnected   string `json:"lastConnected"`
	ConnectionIP    string `json:"connectionIp"`
	Core            string `json:"core"`
	Blocked         bool   `json:"blocked"`
	Online          int    `json:"online"`
	StatusAvailable bool   `json:"statusAvailable"`
}
type Entry struct {
	Device
	Password string `json:"password"`
	Digest   string `json:"digest"`
	Parent   string `json:"parent"`
}
type User struct {
	Limit   int              `json:"limit"`
	Devices map[string]Entry `json:"devices"`
}
type Summary struct {
	EffectiveLimit int      `json:"effectiveLimit"`
	Limit          int      `json:"limit"`
	Devices        []Device `json:"devices"`
}
type Reference struct{ User, Device, Parent, Version string }
