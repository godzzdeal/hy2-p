package security

const MaxCores = 8
const FirstStatsPort = 9999
const FirstChallengePort = 9090

func ReservedTCPPort(port int) bool {
	return port == 8081 || (port >= FirstStatsPort && port < FirstStatsPort+MaxCores) ||
		(port >= FirstChallengePort && port < FirstChallengePort+MaxCores)
}
