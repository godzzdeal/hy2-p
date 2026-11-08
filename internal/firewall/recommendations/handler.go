package recommendations

import (
	"hy2-panel/internal/configuration/deployment"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/transport"
	"hy2-panel/internal/websettings"
	"net/http"
	"os"
	"strconv"
)

type Port struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Purpose  string `json:"purpose"`
	Source   string `json:"source"`
	Pending  bool   `json:"pending"`
}
type Report struct {
	Ports    []Port   `json:"ports"`
	Warnings []string `json:"warnings"`
}

func Handler(web *websettings.Handler, registry *instances.Registry) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		report := Report{Ports: []Port{}, Warnings: []string{}}
		active, saved := web.Active(), web.Current()
		report.add(active.Port, "tcp", "panel", "HY2-P", false)
		if saved.Port != active.Port {
			report.add(saved.Port, "tcp", "panel", "HY2-P", true)
		}
		if active.Mode == "acme" || saved.Mode == "acme" {
			report.add(80, "tcp", "acme-http", "HY2-P", false)
		}
		container := os.Getenv("PANEL_CONTAINER") == "true"
		for _, definition := range registry.Definitions() {
			instance, err := registry.Get(definition.ID)
			if err != nil {
				report.Warnings = append(report.Warnings, definition.Name)
				continue
			}
			settings, err := instance.Config.Get()
			if err != nil {
				report.Warnings = append(report.Warnings, definition.Name)
				continue
			}
			public, _ := deployment.Published(definition.ID)
			ports, err := Core(settings, public, container)
			if err != nil {
				report.Warnings = append(report.Warnings, definition.Name)
				continue
			}
			for _, port := range ports {
				port.Source = definition.Name
				report.Ports = append(report.Ports, port)
			}
		}
		writer.Header().Set("Cache-Control", "no-store")
		transport.Respond(writer, report)
	}
}
func (report *Report) add(port int, protocol, purpose, source string, pending bool) {
	if port > 0 && port <= 65535 {
		report.Ports = append(report.Ports, Port{port, protocol, purpose, source, pending})
	}
}
func portNumber(value string) int {
	number, _ := strconv.Atoi(value)
	if number < 1 || number > 65535 {
		return 0
	}
	return number
}
