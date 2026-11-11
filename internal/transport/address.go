package transport

import (
	"net"
	"os"
	"strconv"
)

const DefaultInternalPort = "8081"

// InternalAddress always binds to loopback, including local preview installations.
func InternalAddress() string {
	port := os.Getenv("PANEL_INTERNAL_PORT")
	if value, err := strconv.ParseUint(port, 10, 16); err != nil || value == 0 {
		port = DefaultInternalPort
	}
	return net.JoinHostPort("127.0.0.1", port)
}
