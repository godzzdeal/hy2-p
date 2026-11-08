package command

import (
	"os/exec"
	"syscall"
)

func configure(process *exec.Cmd) {
	process.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	process.Cancel = func() error {
		if process.Process == nil {
			return nil
		}
		return syscall.Kill(-process.Process.Pid, syscall.SIGKILL)
	}
}
