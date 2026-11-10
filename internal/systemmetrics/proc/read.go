package proc

import (
	"bufio"
	"errors"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const BytesPerKiB = 1024

type Counters struct {
	Total, Idle, MemoryTotal, MemoryUsed, Received, Transmitted uint64
	Uptime, Load                                                float64
	CPUs                                                        int
}

func Read(root string) (Counters, error) {
	var result Counters
	stat, err := os.ReadFile(filepath.Join(root, "stat"))
	if err != nil {
		return result, err
	}
	for _, line := range strings.Split(string(stat), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		if fields[0] == "cpu" {
			for index, value := range fields[1:] {
				number, err := strconv.ParseUint(value, 10, 64)
				if err != nil {
					return result, err
				}
				if index < 8 {
					result.Total += number
				}
				if index == 3 || index == 4 {
					result.Idle += number
				}
			}
		} else if strings.HasPrefix(fields[0], "cpu") {
			result.CPUs++
		}
	}
	if result.Total == 0 || result.CPUs == 0 {
		return result, errors.New("invalid CPU counters")
	}
	memory, err := os.Open(filepath.Join(root, "meminfo"))
	if err != nil {
		return result, err
	}
	defer memory.Close()
	available := uint64(0)
	scanner := bufio.NewScanner(memory)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		number, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			return result, err
		}
		switch fields[0] {
		case "MemTotal:":
			result.MemoryTotal = number * BytesPerKiB
		case "MemAvailable:":
			available = number * BytesPerKiB
		}
	}
	if err := scanner.Err(); err != nil {
		return result, err
	}
	if available > result.MemoryTotal || result.MemoryTotal == 0 {
		return result, errors.New("invalid memory counters")
	}
	result.MemoryUsed = result.MemoryTotal - available
	load, err := firstNumber(filepath.Join(root, "loadavg"))
	if err != nil {
		return result, err
	}
	result.Load = load
	uptime, err := firstNumber(filepath.Join(root, "uptime"))
	if err != nil {
		return result, err
	}
	result.Uptime = uptime
	network, err := os.ReadFile(filepath.Join(root, "net", "dev"))
	if err != nil {
		return result, err
	}
	for _, line := range strings.Split(string(network), "\n") {
		name, values, ok := strings.Cut(line, ":")
		if !ok || !isUplink(strings.TrimSpace(name)) {
			continue
		}
		fields := strings.Fields(values)
		if len(fields) < 9 {
			continue
		}
		received, err := strconv.ParseUint(fields[0], 10, 64)
		if err != nil {
			return result, err
		}
		transmitted, err := strconv.ParseUint(fields[8], 10, 64)
		if err != nil {
			return result, err
		}
		result.Received += received
		result.Transmitted += transmitted
	}
	return result, nil
}
func isUplink(name string) bool {
	for _, prefix := range []string{"lo", "docker", "veth", "br-", "tun", "tap", "wg", "tailscale", "virbr"} {
		if strings.HasPrefix(name, prefix) {
			return false
		}
	}
	return true
}
func firstNumber(path string) (float64, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	fields := strings.Fields(string(payload))
	if len(fields) == 0 {
		return 0, errors.New("empty kernel counter")
	}
	value, err := strconv.ParseFloat(fields[0], 64)
	if err == nil && (math.IsNaN(value) || math.IsInf(value, 0) || value < 0) {
		return 0, errors.New("invalid kernel counter")
	}
	return value, err
}
