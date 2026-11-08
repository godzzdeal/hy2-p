package main

import (
	"context"
	"net"
	"os"
)

func blockUDP(ctx context.Context, address, ready string) error {
	socket, err := net.ListenPacket("udp4", address)
	if err != nil {
		return err
	}
	defer socket.Close()
	if err := os.WriteFile(ready, nil, 0600); err != nil {
		return err
	}
	<-ctx.Done()
	return nil
}
