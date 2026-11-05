package announcement

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFlagTitleSurvivesSaveAndHeaderEncoding(t *testing.T) {
	directory := t.TempDir()
	store, err := Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	writer := httptest.NewRecorder()
	store.Save(writer, httptest.NewRequest("PUT", "/", strings.NewReader(
		`{"profileTitle":"🇩🇪 Германия","enabled":false,"text":"","updateInterval":6}`)))
	if writer.Code != 200 {
		t.Fatal(writer.Body.String())
	}
	restored, err := Open(directory)
	if err != nil {
		t.Fatal(err)
	}
	headers := http.Header{}
	restored.Headers(headers)
	title, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(headers.Get("profile-title"), "base64:"))
	if err != nil || string(title) != "🇩🇪 Германия" {
		t.Fatalf("%q %v", title, err)
	}
	if headers.Get("announce") != "base64:" {
		t.Fatal("title unexpectedly enabled announcements")
	}
	if headers.Get("profile-update-interval") != "6" {
		t.Fatal("interval lost")
	}
}
func TestProfileTitleValidationAndBackwardCompatibility(t *testing.T) {
	for _, title := range []string{strings.Repeat("я", 26), "test\r\nInjected: true", "test\tvalue"} {
		if validate(Settings{ProfileTitle: title, UpdateInterval: 6}) == nil {
			t.Fatal("accepted invalid title")
		}
	}
	if err := validate(Settings{ProfileTitle: "🇩🇪 " + strings.Repeat("я", 22), UpdateInterval: 6}); err != nil {
		t.Fatal(err)
	}
	var old Settings
	if err := json.Unmarshal([]byte(`{"enabled":false,"text":"","updateInterval":6}`), &old); err != nil {
		t.Fatal(err)
	}
	if err := validate(old); err != nil {
		t.Fatal(err)
	}
	store := Store{settings: old}
	headers := http.Header{}
	store.Headers(headers)
	if headers.Get("profile-title") != "" {
		t.Fatal("renamed existing subscriptions without a configured title")
	}
}
