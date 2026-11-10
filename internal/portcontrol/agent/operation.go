package agent

import (
	"hy2-panel/internal/portcontrol/agent/commands"
	"hy2-panel/internal/portcontrol/protocol"
	"hy2-panel/internal/transport"
	"log"
	"net/http"
	"os/exec"
	"time"
)

func (agent *Agent) execute(arguments ...string) error {
	return commands.Run(agent.root, agent.status.ID, randomToken(), arguments...)
}
func (agent *Agent) finish(err error) {
	agent.mu.Lock()
	defer agent.mu.Unlock()
	agent.status.Busy = false
	switch {
	case err == nil:
		agent.status.Phase = "success"
		agent.status.Message = "UDP-порт применён. Проверка Docker и локального UDP пройдена."
		agent.status.UDPChecked = true
		agent.status.CoreChecked = true
		if agent.status.Remove {
			agent.status.Message = "Публикация UDP-порта удалена. Работа остальных экземпляров проверена."
		}
	case exitCode(err) == 10:
		agent.status.Phase = "rolled_back"
		agent.status.Message = "Проверка не прошла. Прежние UDP-порты восстановлены."
	default:
		agent.status.Phase = "failed"
		agent.status.Message = "Не удалось применить или восстановить UDP-порт. Проверьте журнал помощника."
	}
	agent.persist()
}
func exitCode(err error) int {
	if value, ok := err.(*exec.ExitError); ok {
		return value.ExitCode()
	}
	return -1
}
func (agent *Agent) run(request protocol.Request) {
	time.Sleep(time.Second)
	command := "apply-udp"
	if request.Remove {
		command = "remove-udp"
	}
	instance := request.InstanceID
	if instance == "" {
		instance = "default"
	}
	agent.finish(agent.execute(command, agent.status.ID, request.PublicPort, request.ListenPort, instance))
}
func (agent *Agent) recover() {
	// An interrupted transaction is rolled back before accepting another change.
	agent.finish(agent.execute("recover-udp", agent.status.ID))
}

func (agent *Agent) restartPanel(writer http.ResponseWriter, request *http.Request) {
	agent.mu.Lock()
	defer agent.mu.Unlock()
	if agent.status.Busy {
		transport.Fail(writer, errBusy, http.StatusConflict)
		return
	}
	agent.status = protocol.Status{ID: randomToken(), Operation: "restart", Phase: "restarting", Busy: true, Started: time.Now().UTC().Format(time.RFC3339), Message: "Панель перезапускается"}
	if err := agent.persist(); err != nil {
		agent.status.Busy = false
		transport.Fail(writer, err, http.StatusInternalServerError)
		return
	}
	writer.WriteHeader(http.StatusAccepted)
	transport.Respond(writer, agent.status)
	go agent.runRestart("restart-panel")
}

func (agent *Agent) runRestart(command string) {
	time.Sleep(time.Second)
	err := agent.execute(command)
	agent.mu.Lock()
	defer agent.mu.Unlock()
	agent.status.Busy = false
	if err != nil {
		agent.status.Phase = "failed"
		agent.status.Message = "Не удалось перезапустить панель. Проверьте журнал помощника"
		log.Printf("panel restart: %v", err)
	} else {
		agent.status.Phase = "success"
		agent.status.Message = "Панель перезапущена"
	}
	if err := agent.persist(); err != nil {
		log.Printf("persist panel restart: %v", err)
		agent.status.Phase = "failed"
		agent.status.Message = "Не удалось сохранить результат перезапуска"
	}
}
