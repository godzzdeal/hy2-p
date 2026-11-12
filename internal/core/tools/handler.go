package tools

import (
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core/tools/ech"
	"hy2-panel/internal/mimic"
	"hy2-panel/internal/transport"
	"net/http"
)

type Handler struct {
	Config                *configuration.Handler
	Binary                func() string
	Data, Address, Secret string
	Running               func() bool
	InstanceID            string
	Version               func() string
}

func (handler Handler) Mimic(w http.ResponseWriter, r *http.Request) {
	settings, err := handler.Config.Get()
	if err != nil {
		transport.Fail(w, err, 500)
		return
	}
	source := settings.Config
	if r.Method == http.MethodPost {
		var input struct {
			Config string `json:"config"`
		}
		if err := transport.Decode(w, r, &input); err != nil {
			transport.Fail(w, err, 400)
			return
		}
		source = input.Config
	}
	config, err := mimic.Parse(source)
	if err == nil {
		err = mimic.ValidateSource(source)
	}
	if err != nil {
		transport.Fail(w, err, 400)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	status := mimic.Inspect(config, handler.InstanceID)
	if handler.Version != nil {
		status.CheckVersion(handler.Version())
	}
	transport.Respond(w, status)
}

func (handler Handler) Stats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	transport.Respond(w, map[string]any{"listen": handler.Address, "secret": handler.Secret, "running": handler.Running()})
}
func (handler Handler) Read(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	settings, err := handler.Config.Get()
	if err != nil {
		transport.Fail(w, err, 500)
		return
	}
	var config struct {
		ECH struct {
			KeyPath string `yaml:"keyPath"`
		} `yaml:"ech"`
	}
	if err = yaml.Unmarshal([]byte(settings.Config), &config); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	path := config.ECH.KeyPath
	if requested := r.URL.Query().Get("keyPath"); requested != "" && requested != path {
		if !ech.IsGenerated(handler.Data, requested) {
			transport.Fail(w, errors.New("Сначала сохраните путь к внешнему файлу ECH"), 400)
			return
		}
		path = requested
	}
	if path == "" {
		transport.Respond(w, ECH{})
		return
	}
	result, err := Inspect(path)
	if err != nil {
		transport.Fail(w, err, 422)
		return
	}
	transport.Respond(w, result)
}
func (handler Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		PublicName string `json:"publicName"`
	}
	if err := transport.Decode(w, r, &input); err != nil {
		transport.Fail(w, err, 400)
		return
	}
	if !ValidName(input.PublicName) {
		transport.Fail(w, errors.New("Укажите доменное имя для внешнего SNI ECH"), 400)
		return
	}
	result, err := Generate(r.Context(), handler.Binary(), handler.Data, input.PublicName)
	if err != nil {
		transport.Fail(w, err, 422)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	transport.Respond(w, result)
}
