package mimic

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

type Check struct {
	ID     string `json:"id"`
	OK     bool   `json:"ok"`
	Detail string `json:"detail"`
}
type Status struct {
	Ready      bool     `json:"ready"`
	Container  bool     `json:"container"`
	Managed    bool     `json:"managed"`
	InstanceID string   `json:"instanceId"`
	Kernel     string   `json:"kernel"`
	Interfaces []string `json:"interfaces"`
	Checks     []Check  `json:"checks"`
}

func Inspect(config Config, instance string) Status {
	if instance == "" {
		instance = "default"
	}
	result := Status{Ready: true, Container: os.Getenv("PANEL_CONTAINER") == "true", Managed: os.Getenv(EnabledEnv) == "true", InstanceID: os.Getenv(InstanceEnv), Interfaces: []string{}, Checks: []Check{}}
	result.add("platform", runtime.GOOS == "linux", "Mimic работает только в Linux")
	kernel, err := os.ReadFile("/proc/sys/kernel/osrelease")
	result.Kernel = strings.TrimSpace(string(kernel))
	result.add("kernel", err == nil && SupportedKernel(result.Kernel), "Нужен Linux 6.1 или новее")
	_, err = os.Stat("/sys/module/mimic")
	result.add("module", err == nil, "Модуль Linux mimic должен быть загружен")
	path := config.Path
	if path == "" {
		path = "mimic"
	}
	_, err = exec.LookPath(path)
	result.add("binary", err == nil, "Программа Mimic должна быть установлена")
	result.add("root", os.Geteuid() == 0, "Mimic требует запуска экземпляра с правами root")
	if result.Container {
		result.add("installation", result.Managed, "Включите режим установки Mimic")
		result.add("instance", result.Managed && result.InstanceID == instance, "Режим Mimic должен быть назначен этому экземпляру")
		result.add("capabilities", hasCapabilities(), "Нужны NET_ADMIN, NET_RAW, BPF и PERFMON")
		result.add("path", config.Path == "" || config.Path == Binary, "В Docker используется /usr/local/bin/mimic")
	}
	interfaces, _ := net.Interfaces()
	for _, entry := range interfaces {
		if entry.Flags&net.FlagLoopback == 0 && entry.Flags&net.FlagUp != 0 {
			result.Interfaces = append(result.Interfaces, entry.Name)
		}
	}
	if config.Interface != "" {
		_, err = net.InterfaceByName(config.Interface)
		result.add("interface", err == nil, fmt.Sprintf("Интерфейс %s должен существовать в среде экземпляра", config.Interface))
	}
	return result
}

func (status *Status) add(id string, ok bool, detail string) {
	status.Checks = append(status.Checks, Check{ID: id, OK: ok, Detail: detail})
	status.Ready = status.Ready && ok
}

func SupportedKernel(version string) bool {
	parts := strings.SplitN(version, ".", 3)
	if len(parts) < 2 {
		return false
	}
	major, majorError := strconv.Atoi(parts[0])
	minor, minorError := strconv.Atoi(parts[1])
	return majorError == nil && minorError == nil && (major > 6 || major == 6 && minor >= 1)
}

func hasCapabilities() bool {
	const required uint64 = 1<<12 | 1<<13 | 1<<38 | 1<<39
	payload, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return false
	}
	for _, line := range strings.Split(string(payload), "\n") {
		if value, ok := strings.CutPrefix(line, "CapEff:"); ok {
			bits, err := strconv.ParseUint(strings.TrimSpace(value), 16, 64)
			return err == nil && bits&required == required
		}
	}
	return false
}
