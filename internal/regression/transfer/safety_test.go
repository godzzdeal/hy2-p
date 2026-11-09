package transfer_test

import (
	"encoding/json"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/transfer"
	"hy2-panel/internal/transfer/model"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInvalidFilesCannotChangeUsersOrExposeSecrets(t *testing.T) {
	service := setup(t)
	bundle, err := service.Export()
	if err != nil {
		t.Fatal(err)
	}
	for _, mutate := range []func(*model.Bundle){
		func(value *model.Bundle) { value.Format = "other" },
		func(value *model.Bundle) { value.Profiles[0].Settings.Config = "tls: {}\nacme: {}" },
		func(value *model.Bundle) { value.Targets = map[string]string{"unknown": "default"} },
	} {
		raw, _ := json.Marshal(bundle)
		var input model.Bundle
		json.Unmarshal(raw, &input)
		mutate(&input)
		if _, err := service.Preview(input); err == nil {
			t.Fatal("invalid file accepted")
		}
	}
	request := httptest.NewRequest("POST", "/transfer/preview", strings.NewReader(`{"bundle":{"format":"hy2-p/1"},"unexpected":"do not echo this secret"}`))
	response := httptest.NewRecorder()
	service.Import(response, request)
	if response.Code != 400 || strings.Contains(response.Body.String(), "do not echo") {
		t.Fatal(response.Code, response.Body.String())
	}
	exported := httptest.NewRecorder()
	service.Download(exported, httptest.NewRequest("GET", "/transfer", nil))
	if exported.Header().Get("Cache-Control") != "no-store" || !strings.Contains(exported.Header().Get("Content-Disposition"), "attachment") {
		t.Fatal("unsafe download headers")
	}
	var file model.Bundle
	if json.Unmarshal(exported.Body.Bytes(), &file) != nil || file.Format != model.Format {
		t.Fatal("bad exported format")
	}
	var input transfer.Request
	if json.Unmarshal([]byte(`{"bundle":{}}`), &input) != nil {
		t.Fatal("bad request contract")
	}
}

func TestImportedCoreStaysStoppedAndDoesNotGrantAccessToExistingCores(t *testing.T) {
	source, target := setup(t), setup(t)
	response := httptest.NewRecorder()
	source.Users.Create(response, testutil.Request("POST", "/users", `{"name":"Imported laptop"}`))
	if response.Code != 201 {
		t.Fatal(response.Body.String())
	}
	bundle, err := source.Export()
	if err != nil {
		t.Fatal(err)
	}
	bundle.Profiles[0].Name = "Imported core"
	bundle.Profiles[0].Settings.Port = "62000"
	bundle.Profiles[0].Settings.Config = "listen: :62000\nacme:\n  domains:\n    - new.example.org\n"
	preview, err := target.Preview(bundle)
	if err != nil {
		t.Fatal(err)
	}
	if preview.Rows[0].Action != "add" {
		t.Fatal(preview.Rows[0])
	}
	result, err := target.Apply(bundle, preview.Fingerprint)
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range result.Rows {
		if row.Action != "added" {
			t.Fatal(row)
		}
	}
	var id string
	for _, definition := range target.Registry.Definitions() {
		if definition.Name == "Imported core" {
			id = definition.ID
		}
	}
	if id == "" || id == "default" {
		t.Fatal("core mapping missing")
	}
	instance, err := target.Registry.Get(id)
	if err != nil {
		t.Fatal(err)
	}
	if instance.Core.Running() || instance.Core.Watchdog.Snapshot().DesiredRunning {
		t.Fatal("import started a core")
	}
	if !target.Access.Allows(bundle.Users[0].ID, id) || target.Access.Allows(bundle.Users[0].ID, "default") {
		t.Fatal("access was broadened")
	}
	main, err := target.Registry.Get("default")
	if err != nil {
		t.Fatal(err)
	}
	settings, err := main.Config.Get()
	if err != nil || settings.Port != "8443" {
		t.Fatal("existing configuration changed", err)
	}
}
