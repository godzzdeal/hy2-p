package probe

import (
	"context"
	"errors"
	"hy2-panel/internal/portcontrol/protocol"
	"net"
	"os"
	"time"
)

const ProbeWindow = 15 * time.Second

func UDP(port string) error {
	token := os.Getenv(protocol.ProbeTokenEnv)
	if !protocol.TicketPattern.MatchString(token) {
		return errors.New("invalid probe token")
	}
	connection, err := net.Dial("udp", net.JoinHostPort("127.0.0.1", port))
	if err != nil {
		return err
	}
	defer connection.Close()
	deadline := time.Now().Add(ProbeWindow)
	buffer := make([]byte, 128)
	for time.Now().Before(deadline) {
		connection.SetDeadline(time.Now().Add(300 * time.Millisecond))
		if _, err = connection.Write([]byte(token)); err != nil {
			continue
		}
		count, readError := connection.Read(buffer)
		if readError == nil && string(buffer[:count]) == "hy2:"+token {
			return nil
		}
	}
	return context.DeadlineExceeded
}
