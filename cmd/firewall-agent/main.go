package main

import (
	"context"
	"hy2-panel/internal/firewall/host"
	"log"
	"os"
	"os/signal"
	"runtime"
	"syscall"
)

func main() {
	if runtime.GOOS != "linux" {
		log.Fatal("firewall helper requires Linux")
	}
	service, err := host.New(os.Getenv("HY2_INSTALL_DIR"))
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	if err := service.Serve(ctx); err != nil {
		log.Fatal(err)
	}
}
