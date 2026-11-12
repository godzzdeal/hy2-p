package mimic

import (
	"errors"
	"fmt"
	"gopkg.in/yaml.v3"
	"net"
	"regexp"
	"strconv"
	"strings"
)

const Binary = "/usr/local/bin/mimic"
const EnabledEnv = "PANEL_MIMIC_ENABLED"
const InstanceEnv = "PANEL_MIMIC_INSTANCE"
const MaxArguments = 32
const MaxArgumentLength = 256

type Config struct {
	Enabled   bool     `yaml:"enabled" json:"enabled"`
	Interface string   `yaml:"interface" json:"interface"`
	XDPMode   string   `yaml:"xdpMode" json:"xdpMode"`
	Path      string   `yaml:"path" json:"path"`
	ExtraArgs []string `yaml:"extraArgs" json:"extraArgs"`
}

var interfacePattern = regexp.MustCompile(`^[a-zA-Z0-9_.:-]{1,15}$`)

func Parse(source string) (Config, error) {
	var document struct {
		Mimic Config `yaml:"mimic"`
	}
	err := yaml.Unmarshal([]byte(source), &document)
	return document.Mimic, err
}

func Validate(config Config) error {
	if config.XDPMode != "" && config.XDPMode != "native" && config.XDPMode != "skb" {
		return errors.New("mimic.xdpMode: выберите native или skb")
	}
	if config.Interface != "" && !interfacePattern.MatchString(config.Interface) {
		return errors.New("mimic.interface: некорректное имя интерфейса")
	}
	if strings.ContainsAny(config.Path, "\x00\r\n") {
		return errors.New("mimic.path: некорректный путь")
	}
	if len(config.ExtraArgs) > MaxArguments {
		return errors.New("Слишком много аргументов Mimic")
	}
	for _, argument := range config.ExtraArgs {
		if len(argument) > MaxArgumentLength || strings.ContainsAny(argument, "\x00\r\n") {
			return errors.New("Некорректный аргумент Mimic")
		}
	}
	return nil
}

func ValidateSource(source string) error {
	config, err := Parse(source)
	if err != nil {
		return err
	}
	if err = Validate(config); err != nil {
		return err
	}
	if !config.Enabled {
		return nil
	}
	var document struct {
		Listen string `yaml:"listen"`
	}
	if err = yaml.Unmarshal([]byte(source), &document); err != nil {
		return err
	}
	if document.Listen == "" {
		return nil
	}
	_, port, err := net.SplitHostPort(document.Listen)
	number, parseError := strconv.Atoi(port)
	if err != nil || parseError != nil || number < 1 || number > 65535 {
		return fmt.Errorf("Mimic требует один порт в listen и не поддерживает port hopping")
	}
	return nil
}
