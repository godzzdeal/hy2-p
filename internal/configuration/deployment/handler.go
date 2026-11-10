package deployment

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"net/http"
	"os"
)

// ReadFor exposes deployment ports only; credentials and configuration contents stay private.
func ReadFor(config *configuration.Handler, instance string, removing bool, running func() bool, needsHTTP ...func() bool) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		settings, err := config.Get()
		if err != nil {
			http.Error(writer, "Configuration unavailable", 500)
			return
		}
		container := os.Getenv("PANEL_CONTAINER") == "true"
		public, target := Published(instance)
		result, err := Inspect(settings, container, public, target)
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
		if container && len(needsHTTP) > 0 {
			result.HTTPChallenge = result.HTTPChallenge || needsHTTP[0]()
		}
		result.InstanceID = instance
		result.Removing = removing
		if running != nil {
			result.Running = running()
		}
		transport.Respond(writer, result)
	}
}
