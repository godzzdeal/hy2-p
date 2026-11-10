package api

import (
	"hy2-panel/internal/acmehttp"
	"hy2-panel/internal/acmehttp/gateway/backends"
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/subscriptions"
	"os"
)

func (handler Handler) needsHTTP() bool {
	for _, source := range ACMESources(handler.Registry)() {
		settings, err := source.Config.Get()
		if err != nil {
			continue
		}
		domains, err := acmehttp.Domains(settings.Config)
		if err == nil && len(domains) > 0 {
			return true
		}
	}
	return false
}

func Profiles(registry *instances.Registry) func() ([]subscriptions.Profile, error) {
	return func() ([]subscriptions.Profile, error) {
		result := []subscriptions.Profile{}
		for _, definition := range registry.Definitions() {
			if definition.Removing {
				continue
			}
			instance, err := registry.Get(definition.ID)
			if err != nil {
				continue
			}
			settings, err := instance.Config.Get()
			if err != nil {
				return nil, err
			}
			if settings.AuthMode == "native" {
				continue
			}
			if os.Getenv("PANEL_CONTAINER") == "true" {
				public, _ := deployment.Published(definition.ID)
				if public == "" {
					continue
				}
				settings.Port = public
			}
			result = append(result, subscriptions.Profile{ID: definition.ID, Name: definition.Name, Data: instance.Core.Data, Settings: settings})
		}
		return result, nil
	}
}

func ACMESources(registry *instances.Registry) func() []backends.Source {
	return func() []backends.Source {
		result := []backends.Source{}
		for _, definition := range registry.Definitions() {
			if definition.Removing {
				continue
			}
			instance, err := registry.Get(definition.ID)
			if err == nil {
				result = append(result, backends.Source{Config: instance.Config, Port: instance.Core.ChallengePort()})
			}
		}
		return result
	}
}
