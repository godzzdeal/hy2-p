package deployment

import (
	"encoding/json"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/security"
	"net"
	"os"
	"strconv"
)

const DefaultPublishedPort = "8443"
const DefaultListen = ":443"

type PortPair struct {
	PublicPort string `json:"publicPort"`
	ListenPort string `json:"listenPort"`
}

func Published(instance string) (string, string) {
	if os.Getenv("PANEL_CONTAINER") != "true" {
		return "", ""
	}
	if instance == "" || instance == "default" {
		return security.Env("HYSTERIA_PUBLIC_PORT", DefaultPublishedPort), security.Env("HYSTERIA_LISTEN_PORT", DefaultPublishedPort)
	}
	var ports map[string]PortPair
	if json.Unmarshal([]byte(os.Getenv("HYSTERIA_EXTRA_PORTS")), &ports) != nil {
		return "", ""
	}
	return ports[instance].PublicPort, ports[instance].ListenPort
}

type Snapshot struct {
	InstanceID             string `json:"instanceId"`
	Removing               bool   `json:"removing"`
	Running                bool   `json:"running"`
	AgentAvailable         bool   `json:"agentAvailable"`
	AgentBusy              bool   `json:"agentBusy"`
	Container              bool   `json:"container"`
	HTTPChallenge          bool   `json:"httpChallenge"`
	UDPPublicPort          string `json:"udpPublicPort"`
	UDPListenPort          string `json:"udpListenPort"`
	PublishedUDPPort       string `json:"publishedUdpPort"`
	PublishedUDPListenPort string `json:"publishedUdpListenPort"`
	UDPRestartRequired     bool   `json:"udpRestartRequired"`
	UDPWarning             string `json:"udpWarning"`
}

func Inspect(settings configuration.Settings, container bool, published, target string) (Snapshot, error) {
	result := Snapshot{Container: container, UDPPublicPort: settings.Port,
		PublishedUDPPort: published, PublishedUDPListenPort: target}
	var config struct {
		Listen string `yaml:"listen"`
	}
	if err := yaml.Unmarshal([]byte(settings.Config), &config); err != nil {
		return result, err
	}
	if config.Listen == "" {
		config.Listen = DefaultListen
	}
	host, port, err := net.SplitHostPort(config.Listen)
	number, portError := strconv.Atoi(port)
	if err != nil || portError != nil || number < 1 || number > 65535 {
		result.UDPWarning = "Для применения порта Docker из панели укажите один UDP-порт в listen, например :61254."
		return result, nil
	}
	result.UDPListenPort = strconv.Itoa(number)
	if container && host != "" && host != "0.0.0.0" && host != "::" {
		result.UDPWarning = "Для применения порта Docker из панели задайте listen без IP, например :61254."
	}
	address := net.ParseIP(host)
	if container && (host == "localhost" || address != nil && address.IsLoopback()) {
		result.UDPWarning = "Экземпляр слушает только внутри контейнера. Для подключения снаружи укажите listen без 127.0.0.1, например :61254."
	}
	result.UDPRestartRequired = container && (result.UDPPublicPort != published || result.UDPListenPort != target)
	return result, nil
}

func Fingerprint(settings configuration.Settings) string {
	var document map[string]any
	if yaml.Unmarshal([]byte(settings.Config), &document) != nil {
		return ""
	}
	listen, _ := document["listen"].(string)
	if listen == "" {
		listen = DefaultListen
	}
	host, _, parseError := net.SplitHostPort(listen)
	if parseError != nil {
		return ""
	}
	document["listen"] = host
	payload, err := yaml.Marshal(document)
	if err != nil {
		return ""
	}
	mode := settings.AuthMode
	if mode == "" {
		mode = "panel"
	}
	return security.Hash(string(payload) + "\\n" + mode)
}
func RuntimeListen(document map[string]any, port string) {
	number, err := strconv.Atoi(port)
	if err != nil || number < 1 || number > 65535 {
		return
	}
	listen, _ := document["listen"].(string)
	if listen == "" {
		listen = DefaultListen
	}
	host, _, err := net.SplitHostPort(listen)
	if err != nil {
		return
	}
	document["listen"] = net.JoinHostPort(host, strconv.Itoa(number))
}
