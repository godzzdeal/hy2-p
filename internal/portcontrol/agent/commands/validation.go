package commands

import "regexp"
import "hy2-panel/internal/portcontrol/protocol"
import "hy2-panel/internal/cloudbackup/accounts"

var commitPattern = regexp.MustCompile("^[a-f0-9]{40}$")

func ValidCommit(value string) bool { return commitPattern.MatchString(value) }
func ValidCommand(value string) bool {
	switch value {
	case "apply-udp", "remove-udp", "recover-udp", "restart-panel", "start-panel", "update", "rollback", "cleanup-images", "backup", "backup-cloud", "check-cloud":
		return true
	default:
		return false
	}
}
func ValidArguments(arguments []string) bool {
	if len(arguments) == 0 || !ValidCommand(arguments[0]) {
		return false
	}
	if arguments[0] == "update" {
		return len(arguments) == 2 && protocol.PanelVersionPattern.MatchString(arguments[1]) && len(arguments[1]) <= 40
	}
	if arguments[0] == "rollback" {
		return len(arguments) == 2 && arguments[1] == "--yes"
	}
	if arguments[0] == "backup-cloud" || arguments[0] == "check-cloud" {
		return len(arguments) == 1 || (len(arguments) == 2 && accounts.IDPattern.MatchString(arguments[1]))
	}
	if arguments[0] == "cleanup-images" || arguments[0] == "backup" {
		return len(arguments) == 1
	}
	return true
}
