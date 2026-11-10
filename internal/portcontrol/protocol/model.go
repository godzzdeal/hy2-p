package protocol

import (
	"errors"
	"regexp"
	"strconv"
)

const Socket = "/run/hy2-port-agent/control.sock"
const SystemPath = "/system"
const RestartPath = "/restart"
const ProbeTokenEnv = "PANEL_UDP_PROBE_TOKEN"
const ProbeIDEnv = "PANEL_UDP_PROBE_ID"
const ProbePortEnv = "PANEL_UDP_PROBE_PORT"

var TicketPattern = regexp.MustCompile("^[a-f0-9]{32}$")
var InstancePattern = regexp.MustCompile("^(default|[a-f0-9]{16})$")

type Request struct {
	InstanceID string `json:"instanceId,omitempty"`
	Remove     bool   `json:"remove,omitempty"`
	PublicPort string `json:"publicPort"`
	ListenPort string `json:"listenPort"`
}
type Status struct {
	Operation   string `json:"operation,omitempty"`
	InstanceID  string `json:"instanceId,omitempty"`
	Remove      bool   `json:"remove,omitempty"`
	ID          string `json:"id"`
	Phase       string `json:"phase"`
	Message     string `json:"message"`
	PublicPort  string `json:"publicPort"`
	ListenPort  string `json:"listenPort"`
	Busy        bool   `json:"busy"`
	Started     string `json:"started"`
	UDPChecked  bool   `json:"udpChecked"`
	CoreChecked bool   `json:"coreChecked"`
}

func (request Request) Validate() error {
	if request.InstanceID != "" && !InstancePattern.MatchString(request.InstanceID) {
		return errors.New("некорректный экземпляр")
	}
	if request.Remove && (request.InstanceID == "" || request.InstanceID == "default") {
		return errors.New("основной UDP-порт нельзя удалить")
	}
	for _, value := range []string{request.PublicPort, request.ListenPort} {
		port, err := strconv.Atoi(value)
		if err != nil || port < 1 || port > 65535 || strconv.Itoa(port) != value {
			return errors.New("некорректный UDP-порт")
		}
	}
	return nil
}
