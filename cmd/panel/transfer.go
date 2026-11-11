package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"hy2-panel/internal/security"
	"hy2-panel/internal/transfer"
	"hy2-panel/internal/transfer/local"
	"hy2-panel/internal/transfer/model"
	"hy2-panel/internal/transport"
	"io"
	"net/http"
	"os"
	"strings"
)

func transferCommand(mode string, mappings []string) error {
	client := &http.Client{Timeout: model.OperationTimeout}
	if mode == "export" {
		return transferCall(client, "GET", "", nil, os.Stdout)
	}
	if mode != "preview" && mode != "apply" {
		return errors.New("transfer: export, preview или apply")
	}
	payload, err := io.ReadAll(io.LimitReader(os.Stdin, model.MaxBytes+1))
	if err != nil || len(payload) > model.MaxBytes {
		return errors.New("Файл импорта превышает 16 МБ")
	}
	var bundle model.Bundle
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&bundle) != nil || decoder.Decode(new(any)) != io.EOF {
		return errors.New("Ожидается JSON-файл экспорта HY2-P")
	}
	if bundle.Targets == nil {
		bundle.Targets = map[string]string{}
	}
	for _, mapping := range mappings {
		pair := strings.SplitN(mapping, "=", 2)
		if len(pair) != 2 || pair[0] == "" || pair[1] == "" {
			return errors.New("Связь ядра: source=target")
		}
		bundle.Targets[pair[0]] = pair[1]
	}
	body, _ := json.Marshal(transfer.Request{Bundle: bundle})
	var preview bytes.Buffer
	if err := transferCall(client, "POST", "/preview", body, &preview); err != nil {
		return err
	}
	if mode == "preview" {
		_, err := preview.WriteTo(os.Stdout)
		return err
	}
	var result model.Preview
	if err := json.Unmarshal(preview.Bytes(), &result); err != nil {
		return err
	}
	body, _ = json.Marshal(transfer.Request{Bundle: bundle, Fingerprint: result.Fingerprint})
	return transferCall(client, "POST", "/apply", body, os.Stdout)
}
func transferCall(client *http.Client, method, suffix string, body []byte, target io.Writer) error {
	request, err := http.NewRequest(method, "http://"+transport.InternalAddress()+"/transfer"+suffix, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	token, err := os.ReadFile(local.Path(security.Env("PANEL_DATA", "data")))
	if err != nil {
		return errors.New("Служебный ключ недоступен. Выполните команду через sudo hy2-panel")
	}
	request.Header.Set("Authorization", "Bearer "+string(token))
	response, err := client.Do(request)
	if err != nil {
		return errors.New("Панель недоступна. Сначала запустите её")
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		var result struct {
			Error string `json:"error"`
		}
		if json.NewDecoder(response.Body).Decode(&result) == nil && result.Error != "" {
			return errors.New(result.Error)
		}
		return errors.New("Не удалось выполнить перенос данных")
	}
	_, err = io.Copy(target, io.LimitReader(response.Body, model.MaxBytes))
	return err
}
