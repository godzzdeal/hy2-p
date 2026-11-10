package certificates

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"hy2-panel/internal/certificates/files"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"slices"
	"testing"
	"time"
)

func TestInspectIncludesDNSAndIPAddresses(t *testing.T) {
	for _, name := range []string{"mixed", "ip-only", "no-san"} {
		t.Run(name, func(t *testing.T) {
			key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
			if err != nil {
				t.Fatal(err)
			}
			template := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now().Add(-time.Minute), NotAfter: time.Now().Add(time.Hour)}
			expected := []string{}
			if name == "mixed" {
				template.DNSNames = []string{"vpn.example.com"}
				expected = append(expected, "vpn.example.com")
			}
			if name != "no-san" {
				template.IPAddresses = []net.IP{net.ParseIP("203.0.113.10"), net.ParseIP("2001:db8::10")}
				expected = append(expected, "203.0.113.10", "2001:db8::10")
			}
			der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
			if err != nil {
				t.Fatal(err)
			}
			path := filepath.Join(t.TempDir(), "server.crt")
			if err := os.WriteFile(path, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0600); err != nil {
				t.Fatal(err)
			}
			result, err := files.Read(path)
			if err != nil {
				t.Fatal(err)
			}
			if result.Domains == nil || !slices.Equal(result.Domains, expected) {
				t.Fatalf("certificate names: got %v want %v", result.Domains, expected)
			}
		})
	}
}
