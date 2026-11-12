package integration

import (
	"context"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/config"
	"hy2-panel/internal/cloudbackup/accounts/oauth/apps"
	"hy2-panel/internal/cloudbackup/transfer"
	"net/http"
	"strings"
	"testing"
)

func TestPrepareRefreshesAndKeepsRefreshTokenOutOfContainer(t *testing.T) {
	tokenEndpoint(t, "oauth2.googleapis.com", func(writer http.ResponseWriter, request *http.Request) {
		if request.ParseForm() != nil || request.Form.Get("grant_type") != "refresh_token" || request.Form.Get("refresh_token") != "OLD-REFRESH" {
			writer.WriteHeader(400)
			return
		}
		writer.Write([]byte(`{"access_token":"NEW-ACCESS","refresh_token":"NEW-REFRESH","expires_in":3600}`))
	})
	root := t.TempDir()
	if err := apps.Save(root, apps.Application{Provider: "google", ClientID: "test-app", Secret: "APP-PRIVATE", Origin: "https://panel.example.invalid"}); err != nil {
		t.Fatal(err)
	}
	id := strings.Repeat("a", 32)
	catalog := accounts.Catalog{Accounts: []accounts.Account{{ID: id, Name: "Drive", Provider: "google", Folder: "HY2-P", ClientID: "test-app", Token: &accounts.Token{AccessToken: "OLD-ACCESS", RefreshToken: "OLD-REFRESH"}}}}
	if err := accounts.Save(root, catalog); err != nil {
		t.Fatal(err)
	}
	result, err := transfer.Prepare(context.Background(), root, id)
	if err != nil || !strings.Contains(result.ConfigText, "NEW-ACCESS") || strings.Contains(result.ConfigText, "REFRESH") || result.Destination != "cloud:HY2-P" {
		t.Fatalf("prepare: %v %#v", err, result)
	}
	stored, err := accounts.Read(root)
	if err != nil || stored.Accounts[0].Token.RefreshToken != "NEW-REFRESH" {
		t.Fatal("rotated refresh token lost")
	}
	if _, err = transfer.Prepare(context.Background(), root, "../elsewhere"); err == nil {
		t.Fatal("invalid storage accepted")
	}
}

func TestWebDAVPasswordIsRcloneCompatible(t *testing.T) {
	account, err := config.Create(accounts.Input{Name: "WebDAV", Provider: "webdav", Folder: "HY2-P", Endpoint: "https://cloud.example.invalid/dav", Username: "user", Password: "TEST-PASSWORD"}, strings.Repeat("a", 32))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(account.ConfigText, "TEST-PASSWORD") || !strings.Contains(account.ConfigText, "pass = ") {
		t.Fatal("password not encoded for rclone")
	}
	result, err := config.Render(account)
	if err != nil || result.Destination != "cloud:HY2-P" {
		t.Fatal("invalid remote")
	}
}
