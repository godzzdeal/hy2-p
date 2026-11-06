package instances_test

import (
	"encoding/json"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"strings"
	"testing"
)

func TestSubscriptionsUseOnlyPublishedPorts(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	t.Setenv("PANEL_CONTAINER", "true")
	t.Setenv("HYSTERIA_PUBLIC_PORT", "8443")
	t.Setenv("HYSTERIA_LISTEN_PORT", "8443")
	registry := openRegistry(t, t.TempDir())
	extra, err := registry.Add("Second", settings("8444"))
	if err != nil {
		t.Fatal(err)
	}
	read := instanceapi.Profiles(registry)
	profiles, err := read()
	if err != nil || len(profiles) != 1 {
		t.Fatal("unpublished core exported", profiles, err)
	}
	t.Setenv("HYSTERIA_EXTRA_PORTS", `{"`+extra.ID+`":{"publicPort":"8445","listenPort":"8444"}}`)
	profiles, err = read()
	if err != nil || len(profiles) != 2 || profiles[1].Settings.Port != "8445" {
		t.Fatal("wrong active port", profiles, err)
	}
	if profiles[0].Settings.Port != "8443" {
		t.Fatal("default port changed")
	}
}

func TestScopedConfigurationAndHistory(t *testing.T) {
	t.Setenv("HYSTERIA_BIN", "missing-hysteria-test-binary")
	registry := openRegistry(t, t.TempDir())
	mux := routes(registry)
	created := request(mux, "POST", "/api/instances", map[string]any{"name": "Second", "settings": settings("8444")})
	if created.Code != 201 {
		t.Fatal(created.Body.String())
	}
	var result struct{ ID string }
	json.Unmarshal(created.Body.Bytes(), &result)
	path := "/api/instances/" + result.ID
	draft := settings("8444")
	draft.Config += "disableUDP: true\n"
	if saved := request(mux, "PUT", path+"/settings", draft); saved.Code != 200 {
		t.Fatal(saved.Body.String())
	}
	var main configuration.Settings
	json.Unmarshal(request(mux, "GET", "/api/settings", nil).Body.Bytes(), &main)
	if strings.Contains(main.Config, "disableUDP") || main.Port != "8443" {
		t.Fatal("default changed", main)
	}
	history := request(mux, "GET", path+"/history", nil)
	if history.Code != 200 || !strings.Contains(history.Body.String(), "8444") {
		t.Fatal(history.Body.String())
	}
	conflict := request(mux, "PUT", path+"/settings", settings("8443"))
	if conflict.Code != 409 {
		t.Fatal("port conflict accepted", conflict.Body.String())
	}
	list := request(mux, "GET", "/api/instances", nil)
	var summaries []instanceapi.Summary
	if err := json.Unmarshal(list.Body.Bytes(), &summaries); err != nil || len(summaries) != 2 {
		t.Fatal(list.Body.String())
	}
	if strings.Contains(list.Body.String(), "/certs") || strings.Contains(list.Body.String(), "secret") {
		t.Fatal("configuration leak")
	}
	if result := request(mux, "DELETE", "/api/instances/"+instances.DefaultID, nil); result.Code != 409 {
		t.Fatal("removed default")
	}
	if removed := request(mux, "DELETE", path, nil); removed.Code != 200 {
		t.Fatal(removed.Body.String())
	}
	if missing := request(mux, "GET", path+"/settings", nil); missing.Code < 400 {
		t.Fatal("deleted core accessible")
	}
}
