package host

import (
	"context"
	"errors"
	"fmt"
	"hy2-panel/internal/firewall"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

const UFW = "/usr/sbin/ufw"
const Docker = "/usr/bin/docker"
const MaxRules = 16

var publishedPattern = regexp.MustCompile(`:(\d+)->\d+/(tcp|udp)`)
var rulePattern = regexp.MustCompile(`^\[\s*(\d+)\]\s+(\d+)/(tcp|udp)(?:\s+\(v6\))?\s+(?:ALLOW|DENY)(?:\s+IN)?\s+Anywhere(?:\s+\(v6\))?(?:\s+#.*)?$`)

type Result struct {
	Active         bool   `json:"active"`
	Output         string `json:"output"`
	ProtectedPorts []int  `json:"protectedPorts"`
}

func (service *Service) Status(ctx context.Context) (Result, error) {
	ports, err := service.protectedPorts()
	if err != nil {
		return Result{}, errors.New("Не удалось прочитать защищённые порты firewall")
	}
	value, err := service.Execute(ctx, UFW, "status", "verbose")
	return Result{Active: strings.HasPrefix(value, "Status: active"), Output: value, ProtectedPorts: ports}, err
}
func (service *Service) Change(ctx context.Context, change firewall.Change) (Result, error) {
	if err := change.Validate(); err != nil {
		return Result{}, err
	}
	ports, err := service.protectedPorts()
	if err != nil {
		return Result{}, errors.New("Не удалось прочитать защищённые порты firewall")
	}
	if change.Protocol == "tcp" && slices.Contains(ports, change.Port) {
		return Result{}, errors.New("Изменение защищённого порта SSH или панели запрещено")
	}
	if change.Action == "deny" {
		output, err := service.Execute(ctx, Docker, "ps", "--format", "{{.Ports}}")
		if err != nil {
			return Result{}, errors.New("Не удалось проверить публикацию Docker. Закрытие порта отменено")
		}
		for _, match := range publishedPattern.FindAllStringSubmatch(output, -1) {
			if match[1] == strconv.Itoa(change.Port) && match[2] == change.Protocol {
				return Result{}, errors.New("Порт опубликован Docker. UFW его не блокирует; измените публикацию контейнера.")
			}
		}
	}
	status, err := service.Status(ctx)
	if err != nil {
		return Result{}, err
	}
	if !status.Active {
		return Result{}, errors.New("UFW выключен. Сначала настройте и включите firewall на сервере.")
	}
	numbered, err := service.Execute(ctx, UFW, "status", "numbered")
	if err != nil {
		return Result{}, err
	}
	indices := []int{}
	for _, line := range strings.Split(numbered, "\n") {
		match := rulePattern.FindStringSubmatch(strings.TrimSpace(line))
		if match != nil && match[2] == strconv.Itoa(change.Port) && match[3] == change.Protocol {
			index, _ := strconv.Atoi(match[1])
			indices = append(indices, index)
		}
	}
	if len(indices) > MaxRules {
		return Result{}, errors.New("Слишком много правил для одного порта. Проверьте их на сервере.")
	}
	slices.Sort(indices)
	slices.Reverse(indices)
	for _, index := range indices {
		if _, err := service.Execute(ctx, UFW, "--force", "delete", strconv.Itoa(index)); err != nil {
			return Result{}, err
		}
	}
	if _, err := service.Execute(ctx, UFW, "insert", "1", change.Action, fmt.Sprintf("%d/%s", change.Port, change.Protocol), "comment", "HY2-P"); err != nil {
		return Result{}, err
	}
	return service.Status(ctx)
}
