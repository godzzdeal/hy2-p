package main

import (
	"hy2-panel/internal/portcontrol/probe"
	"hy2-panel/internal/server"
	"log"
)

func main() {
	if err := probe.Preflight(); err != nil {
		log.Fatal(err)
	}
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
