package main

import (
	"hy2-panel/internal/auth/credentials"
	"hy2-panel/internal/auth/recovery"
	"hy2-panel/internal/portcontrol/probe"
	"hy2-panel/internal/security"
	"hy2-panel/internal/server"
	"log"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) == 2 && os.Args[1] == "--reset-admin-password" {
		if err := recovery.Reset(os.Stdin, os.Stdout, security.Env("PANEL_DATA", "data"), security.Env("PANEL_ADMIN_USERNAME", "admin")); err != nil {
			log.Fatal(err)
		}
		return
	}
	if len(os.Args) >= 3 && os.Args[1] == "--transfer" {
		if err := transferCommand(os.Args[2], os.Args[3:]); err != nil {
			log.Fatal(err)
		}
		return
	}
	if len(os.Args) == 2 && os.Args[1] == "--reset-cloud-password" {
		if err := credentials.ResetCloud(filepath.Join(security.Env("PANEL_DATA", "data"), "admin")); err != nil {
			log.Fatal(err)
		}
		log.Print("Облачный пароль отключён. Основной пароль не изменён.")
		return
	}
	if err := probe.Preflight(); err != nil {
		log.Fatal(err)
	}
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
