package security

import (
	"hy2-panel/internal/transport"
	"net"
	"strconv"
)

const MaxCores = 8
const FirstStatsPort = 9999
const FirstChallengePort = 9090

func ReservedTCPPort(port int) bool {
	_, value, _ := net.SplitHostPort(transport.InternalAddress())
	internal, _ := strconv.Atoi(value)
	return port == internal || (port >= FirstStatsPort && port < FirstStatsPort+MaxCores) ||
		(port >= FirstChallengePort && port < FirstChallengePort+MaxCores)
}
