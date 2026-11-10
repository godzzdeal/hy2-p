package ipcert

import (
	"context"
	"crypto/tls"
	"net"
	"net/http/httptest"
	"testing"

	"github.com/caddyserver/certmagic"
)

func TestIPCertificatesSelectShortLivedProfileAndRestrictIssuance(t *testing.T) {
	magic, issuer, cache := configuration(t.TempDir(), "8.8.8.8", "test@example.com", "0.0.0.0", 9080)
	defer cache.Stop()
	if issuer.Profile != "shortlived" || !issuer.DisableTLSALPNChallenge || issuer.AltHTTPPort != 9080 || magic.DefaultServerName != "8.8.8.8" {
		t.Fatal("IP certificate policy is incomplete")
	}
	if magic.OnDemand != nil {
		t.Fatal("untrusted TLS handshakes can trigger issuance")
	}
	fixture := &fixtureIssuer{}
	magic.Issuers = []certmagic.Issuer{fixture}
	connection, peer := net.Pipe()
	defer connection.Close()
	defer peer.Close()
	if _, err := magic.GetCertificateWithContext(context.Background(), &tls.ClientHelloInfo{ServerName: "example.com", Conn: connection}); err == nil || fixture.count != 0 {
		t.Fatal("handshake triggered issuance for another name")
	}
	tlsConfig, challenge, closeTLS, err := New(t.TempDir(), "8.8.8.8", "test@example.com", "0.0.0.0", 9080)
	if err != nil {
		t.Fatal(err)
	}
	defer closeTLS()
	if tlsConfig.GetCertificate == nil || challenge.Addr != "0.0.0.0:9080" || challenge.BaseContext == nil {
		t.Fatal("listeners not configured")
	}
	writer := httptest.NewRecorder()
	challenge.Handler.ServeHTTP(writer, httptest.NewRequest("GET", "http://8.8.8.8/not-a-challenge", nil))
	if writer.Code != 404 {
		t.Fatal("challenge server exposes unexpected routes")
	}
}

func TestIPCertificatePersistsRenewsAndSupportsClientsWithoutSNI(t *testing.T) {
	directory := t.TempDir()
	magic, _, cache := configuration(directory, "8.8.8.8", "test@example.com", "0.0.0.0", 9080)
	defer cache.Stop()
	issuer := &fixtureIssuer{}
	magic.Issuers = []certmagic.Issuer{issuer}
	magic.OnDemand = nil
	ctx := context.Background()
	if err := magic.ManageSync(ctx, []string{"8.8.8.8"}); err != nil {
		t.Fatal(err)
	}
	first, err := magic.GetCertificate(&tls.ClientHelloInfo{})
	if err != nil || first.Leaf.VerifyHostname("8.8.8.8") != nil {
		t.Fatal("IP certificate unavailable without SNI", err)
	}
	if err := magic.RenewCertSync(ctx, "8.8.8.8", true); err != nil {
		t.Fatal(err)
	}
	restored, _, secondCache := configuration(directory, "8.8.8.8", "test@example.com", "0.0.0.0", 9080)
	defer secondCache.Stop()
	restored.Issuers = []certmagic.Issuer{issuer}
	restored.OnDemand = nil
	if err := restored.ManageSync(ctx, []string{"8.8.8.8"}); err != nil {
		t.Fatal(err)
	}
	next, err := restored.GetCertificate(&tls.ClientHelloInfo{})
	if err != nil || next.Leaf.SerialNumber.Cmp(first.Leaf.SerialNumber) == 0 {
		t.Fatal("renewed certificate was not restored", err)
	}
	if issuer.count != 2 {
		t.Fatal("restart reissued a valid certificate")
	}
}
