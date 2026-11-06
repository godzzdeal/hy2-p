package portcontrol_test

import (
	"hy2-panel/internal/portcontrol/probe"
	"hy2-panel/internal/portcontrol/protocol"
	"net"
	"testing"
	"time"
)

func TestUDPProbeRequiresMatchingResponse(t *testing.T) {
	token := "0123456789abcdef0123456789abcdef"
	t.Setenv(protocol.ProbeTokenEnv, token)
	socket, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer socket.Close()
	_, port, _ := net.SplitHostPort(socket.LocalAddr().String())
	socket.SetDeadline(time.Now().Add(3 * time.Second))
	go func() {
		packet := make([]byte, 128)
		count, address, err := socket.ReadFrom(packet)
		if err != nil {
			return
		}
		socket.WriteTo([]byte("unrelated"), address)
		socket.WriteTo(append([]byte("hy2:"), packet[:count]...), address)
	}()
	if err = probe.UDP(port); err != nil {
		t.Fatal(err)
	}
}
