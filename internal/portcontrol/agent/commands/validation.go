package commands

import "regexp"

var commitPattern = regexp.MustCompile("^[a-f0-9]{40}$")

func ValidCommit(value string) bool { return commitPattern.MatchString(value) }
func ValidCommand(value string) bool {
	switch value {
	case "apply-udp", "remove-udp", "recover-udp", "restart-panel", "start-panel":
		return true
	default:
		return false
	}
}
