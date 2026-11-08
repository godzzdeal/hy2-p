package host

import (
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const MaxMetadata = 1 << 20

func validateRoot(root string) error {
	if !filepath.IsAbs(root) || filepath.Clean(root) != root || filepath.Dir(root) == root {
		return errors.New("invalid installation directory")
	}
	real, err := filepath.EvalSymlinks(root)
	if err != nil || real != root {
		return errors.New("installation directory must not contain symlinks")
	}
	return nil
}
func (service *Service) protectedPorts() ([]int, error) {
	file, err := os.Open(filepath.Join(service.Root, "firewall", "protected.json"))
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var ports []int
	decoder := json.NewDecoder(io.LimitReader(file, MaxMetadata))
	if decoder.Decode(&ports) != nil || len(ports) == 0 || len(ports) > 128 {
		return nil, errors.New("invalid protected ports")
	}
	for _, port := range ports {
		if port < 1 || port > 65535 {
			return nil, errors.New("invalid protected port")
		}
	}
	ports = append(ports, 22)
	environment, err := os.Open(filepath.Join(service.Root, ".env"))
	if err != nil {
		return nil, err
	}
	defer environment.Close()
	scanner := bufio.NewScanner(io.LimitReader(environment, MaxMetadata))
	panelPort := 0
	for scanner.Scan() {
		if value, ok := strings.CutPrefix(scanner.Text(), "PANEL_PORT="); ok {
			panelPort, _ = strconv.Atoi(value)
		}
	}
	if scanner.Err() != nil || panelPort < 1 || panelPort > 65535 {
		return nil, errors.New("panel port unavailable; refusing rule change")
	}
	return append(ports, panelPort), nil
}
