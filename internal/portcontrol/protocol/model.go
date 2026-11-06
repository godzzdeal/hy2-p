package protocol

import (
	"errors"
	"regexp"
	"strconv"
)

const Socket = "/run/hy2-port-agent/control.sock"
const ProbeTokenEnv = "PANEL_UDP_PROBE_TOKEN"
const ProbeIDEnv = "PANEL_UDP_PROBE_ID"

var TicketPattern = regexp.MustCompile("^[a-f0-9]{32}$")

type Request struct {
	PublicPort string `json:"publicPort"`
	ListenPort string `json:"listenPort"`
}
type Status struct {
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
	for _, value := range []string{request.PublicPort, request.ListenPort} {
		port, err := strconv.Atoi(value)
		if err != nil || port < 1 || port > 65535 || strconv.Itoa(port) != value {
			return errors.New("некорректный UDP-порт")
		}
	}
	return nil
}
