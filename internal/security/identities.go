package security

import (
	"regexp"
	"strings"
)

var pattern = regexp.MustCompile(`^([a-f0-9]{16})\.([a-f0-9]{32})\.([a-f0-9]{16})$`)

type ConnectionIdentity struct{ User, Device, Version string }

func ParseIdentity(value string) (ConnectionIdentity, bool) {
	parts := pattern.FindStringSubmatch(value)
	if parts == nil {
		return ConnectionIdentity{}, false
	}
	return ConnectionIdentity{parts[1], parts[2], parts[3]}, true
}
func DeviceIdentity(user, device, version string) string { return user + "." + device + "." + version }
func ParentUser(value string) string {
	if parsed, ok := ParseIdentity(value); ok {
		return parsed.User
	}
	return value
}
func IdentityStamp(digest string) string { return Hash(digest)[:16] }
func MatchesIdentity(value, target string) bool {
	return value == target || strings.HasPrefix(value, target+".")
}
