package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"time"
)

const Lifetime = 4 * time.Minute

func main() {
	if len(os.Args) != 4 {
		log.Fatal("usage: fixture udp|http address path")
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()
	ctx, deadline := context.WithTimeout(ctx, Lifetime)
	defer deadline()
	var err error
	switch os.Args[1] {
	case "udp":
		err = blockUDP(ctx, os.Args[2], os.Args[3])
	case "http":
		err = serveHTTP(ctx, os.Args[2], os.Args[3])
	default:
		log.Fatal("unknown fixture mode")
	}
	if err != nil {
		log.Fatal(err)
	}
}
