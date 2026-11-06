package main

import (
	"context"
	"hy2-panel/internal/portcontrol/agent"
	"hy2-panel/internal/portcontrol/probe"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/security"
	"log"
	"os"
)

func main() {
	var err error
	mode := "serve"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}
	switch mode {
	case "serve":
		var server *agent.Agent
		server, err = agent.New(os.Getenv("HY2_INSTALL_DIR"))
		if err == nil {
			err = server.Serve()
		}
	case "probe":
		if len(os.Args) != 3 {
			log.Fatal("expected UDP port")
		}
		err = (protocol.Request{PublicPort: os.Args[2], ListenPort: os.Args[2]}).Validate()
		if err == nil {
			err = probe.UDP(os.Args[2])
		}
	case "check-core":
		err = probe.Core(security.Env("PANEL_DATA", "/data"))
	case "health":
		_, err = protocol.Call(context.Background(), "GET", nil)
	default:
		log.Fatal("unknown mode")
	}
	if err != nil {
		log.Fatal(err)
	}
}
