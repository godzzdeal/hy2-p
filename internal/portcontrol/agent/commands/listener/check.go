package listener

import (
	"bufio"
	"fmt"
	"hy2-panel/internal/records"
	"hy2-panel/internal/websettings"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func Check(root, data string) error {
	var config websettings.Config
	if err := records.Read(filepath.Join(data, "web"), "web", &config); os.IsNotExist(err) {
		return nil
	} else if err != nil {
		return err
	}
	file, err := os.Open(filepath.Join(root, ".env"))
	if err != nil {
		return err
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if scanner.Text() == "PANEL_PORT="+strconv.Itoa(config.Port) {
			return nil
		}
	}
	if err = scanner.Err(); err != nil {
		return err
	}
	listener, err := net.Listen("tcp", net.JoinHostPort(strings.Trim(config.Host, "[]"), strconv.Itoa(config.Port)))
	if err != nil {
		return fmt.Errorf("TCP-порт %d недоступен. Выберите свободный порт: %w", config.Port, err)
	}
	return listener.Close()
}
