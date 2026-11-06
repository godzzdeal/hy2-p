package probe

import (
	"context"
	"hy2-panel/internal/portcontrol/protocol"
	"net"
	"os"
	"time"
)

func Preflight() error {
	token := os.Getenv(protocol.ProbeTokenEnv)
	id := os.Getenv(protocol.ProbeIDEnv)
	if token == "" || id == "" {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	state, err := protocol.Call(ctx, "GET", nil)
	// A normal restart after a completed operation must never wait for the old probe.
	if err != nil || !state.Busy || state.ID != id {
		return nil
	}
	if !protocol.TicketPattern.MatchString(token) {
		return os.ErrInvalid
	}
	socket, err := net.ListenPacket("udp", net.JoinHostPort("", os.Getenv("HYSTERIA_LISTEN_PORT")))
	if err != nil {
		return err
	}
	defer socket.Close()
	socket.SetDeadline(time.Now().Add(ProbeWindow))
	packet := make([]byte, 128)
	for {
		count, address, err := socket.ReadFrom(packet)
		if err != nil {
			return err
		}
		if string(packet[:count]) != token {
			continue
		}
		_, err = socket.WriteTo([]byte("hy2:"+token), address)
		return err
	}
}
