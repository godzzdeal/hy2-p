package subscriptions_test

import (
	"encoding/base64"
	"encoding/json"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/testutil"
	"hy2-panel/internal/users"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestAnnouncementDeliveryAndPersistence(t *testing.T) {
	directory := t.TempDir()
	store, err := announcement.Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	save := func(settings announcement.Settings) int {
		body, _ := json.Marshal(settings)
		writer := httptest.NewRecorder()
		store.Save(writer, testutil.Request("PUT", "/announcement", string(body)))
		return writer.Code
	}
	text := "Технические работы\nСервис вернётся в 04:00"
	if save(announcement.Settings{Enabled: true, Text: text, UpdateInterval: 1}) != 200 {
		t.Fatal("save failed")
	}
	store, err = announcement.Open(directory)
	if err != nil || store.Current().Text != text {
		t.Fatal("announcement not persisted", err)
	}
	app := testutil.New(t)
	app.Subscriptions.Announcements = store
	created := httptest.NewRecorder()
	app.Users.Create(created, testutil.Request("POST", "/users", `{"name":"Test"} `))
	var user users.User
	json.Unmarshal(created.Body.Bytes(), &user)
	user, err = app.Users.User(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	request := testutil.Request("GET", "/sub/test", "")
	request.SetPathValue("token", user.Token)
	result := httptest.NewRecorder()
	app.Subscriptions.Serve(result, request)
	announcementText, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(result.Header().Get("announce"), "base64:"))
	if err != nil || string(announcementText) != text || result.Header().Get("profile-update-interval") != "1" {
		t.Fatal("incorrect announcement headers")
	}
	content, err := base64.StdEncoding.DecodeString(result.Body.String())
	if err != nil {
		t.Fatal(err)
	}
	uri, err := url.Parse(strings.TrimSpace(string(content)))
	if err != nil || uri.User.Username() != user.Password {
		t.Fatal("subscription must contain the actual client credential")
	}
	if save(announcement.Settings{Enabled: false, Text: text, UpdateInterval: 6}) != 200 {
		t.Fatal("disable failed")
	}
	cleared := httptest.NewRecorder()
	app.Subscriptions.Serve(cleared, request)
	if cleared.Header().Get("announce") != "base64:" {
		t.Fatal("client announcement not explicitly cleared")
	}
	if save(announcement.Settings{Enabled: true, Text: strings.Repeat("🚧", 200), UpdateInterval: 1}) != 200 {
		t.Fatal("Unicode limit must count characters")
	}
	invalid := []announcement.Settings{
		{Enabled: true, Text: " ", UpdateInterval: 1},
		{Enabled: true, Text: strings.Repeat("🚧", 201), UpdateInterval: 1},
		{Text: "test", UpdateInterval: 0},
		{Text: "test", UpdateInterval: 169},
	}
	for _, settings := range invalid {
		if save(settings) != 400 {
			t.Fatal("invalid announcement accepted")
		}
	}
}
