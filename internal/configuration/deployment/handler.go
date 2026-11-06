package deployment

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
)

// Read exposes deployment ports only; credentials and configuration contents stay private.
func Read(config *configuration.Handler) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		settings, err := config.Get()
		if err != nil {
			http.Error(writer, "Configuration unavailable", 500)
			return
		}
		container := os.Getenv("PANEL_CONTAINER") == "true"
		result, err := Inspect(settings, container,
			security.Env("HYSTERIA_PUBLIC_PORT", DefaultPublishedPort),
			security.Env("HYSTERIA_LISTEN_PORT", DefaultPublishedPort))
		if err != nil {
			http.Error(writer, "Invalid configuration", 500)
			return
		}
		domains, err := acmehttp.Domains(settings.Config)
		if err != nil {
			http.Error(writer, "Invalid configuration", 500)
			return
		}
		if agent, agentError := protocol.Call(request.Context(), "GET", nil); agentError == nil {
			result.AgentAvailable = true
			result.AgentBusy = agent.Busy
		}
		result.HTTPChallenge = container && len(domains) > 0
		transport.Respond(writer, result)
	}
}
