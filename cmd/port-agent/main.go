package main

import (
	"context"
	cloudtransfer "hy2-panel/internal/cloudbackup/transfer"
	"hy2-panel/internal/panelmaintenance/job"
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
	case "cloud-config", "cloud-save":
		err = cloudtransfer.CLI(context.Background(), os.Getenv("HY2_INSTALL_DIR"), os.Args[1:], os.Stdout)
	case "maintenance":
		if len(os.Args) != 3 {
			log.Fatal("expected maintenance ticket")
		}
		err = job.Run(os.Getenv("HY2_INSTALL_DIR"), os.Args[2])
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
