package security_test

import (
	"context"
	"encoding/json"
	"hy2-panel/internal/core/statistics"
	"hy2-panel/internal/security"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
)

func TestDeviceIdentitiesAndSelectiveDisconnect(t *testing.T) {
	user := strings.Repeat("a", 16)
	firstDevice := strings.Repeat("b", 32)
	secondDevice := strings.Repeat("c", 32)
	first := security.DeviceIdentity(user, firstDevice, strings.Repeat("d", 16))
	second := security.DeviceIdentity(user, secondDevice, strings.Repeat("e", 16))
	other := security.DeviceIdentity(strings.Repeat("f", 16), firstDevice, strings.Repeat("d", 16))
	if security.ParentUser(first) != user || security.ParentUser("legacy") != "legacy" {
		t.Fatal("identity mapping failed")
	}
	results := make(chan []string, 2)
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "secret" {
			writer.WriteHeader(401)
			return
		}
		if request.URL.Path == "/online" {
			json.NewEncoder(writer).Encode(map[string]int{user: 1, first: 1, second: 1, other: 1})
			return
		}
		var ids []string
		if err := json.NewDecoder(request.Body).Decode(&ids); err != nil {
			t.Error(err)
		}
		results <- ids
		writer.WriteHeader(204)
	}))
	defer server.Close()
	client := statistics.Client{Address: server.URL, Secret: "secret"}
	if err := client.KickUser(context.Background(), user+"."+firstDevice); err != nil {
		t.Fatal(err)
	}
	kicked := <-results
	if !slices.Contains(kicked, first) || slices.Contains(kicked, second) || slices.Contains(kicked, user) || slices.Contains(kicked, other) {
		t.Fatal("another device was disconnected", kicked)
	}
	if err := client.KickUser(context.Background(), user); err != nil {
		t.Fatal(err)
	}
	kicked = <-results
	if !slices.Contains(kicked, first) || !slices.Contains(kicked, second) || !slices.Contains(kicked, user) || slices.Contains(kicked, other) {
		t.Fatal("parent disconnect missed device sessions", kicked)
	}
}
