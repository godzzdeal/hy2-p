package updates

import (
	"regexp"
	"strings"
)

var stableVersion = regexp.MustCompile(`^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)

func versionState(current, latest string) string {
	if !stableVersion.MatchString(current) {
		return "unknown"
	}
	installed := strings.Split(strings.TrimPrefix(current, "v"), ".")
	available := strings.Split(strings.TrimPrefix(latest, "v"), ".")
	for index, part := range installed {
		other := available[index]
		if part == other {
			continue
		}
		if len(part) < len(other) || len(part) == len(other) && part < other {
			return "update_available"
		}
		return "ahead"
	}
	return "current"
}
