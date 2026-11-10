package ipcert

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"math/big"
	"time"

	"github.com/caddyserver/certmagic"
)

type fixtureIssuer struct{ count int }

func (*fixtureIssuer) IssuerKey() string { return "local-test-ca" }
func (issuer *fixtureIssuer) Issue(_ context.Context, request *x509.CertificateRequest) (*certmagic.IssuedCertificate, error) {
	issuer.count++
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}
	certificate := &x509.Certificate{
		SerialNumber: big.NewInt(int64(issuer.count)), IPAddresses: request.IPAddresses,
		NotBefore: time.Now().Add(-time.Minute), NotAfter: time.Now().Add(160 * time.Hour),
		KeyUsage: x509.KeyUsageDigitalSignature, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, certificate, certificate, request.PublicKey, key)
	if err != nil {
		return nil, err
	}
	return &certmagic.IssuedCertificate{Certificate: pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})}, nil
}
