package files

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"hy2-panel/internal/security"
	"io"
	"os"
	"path/filepath"
	"time"
)

const MaxCertificateSize = 1 << 20

type Certificate struct {
	Path      string   `json:"path"`
	Domains   []string `json:"domains"`
	NotAfter  string   `json:"notAfter"`
	Expired   bool     `json:"expired"`
	PinSHA256 string   `json:"pinSHA256"`
	leaf      *x509.Certificate
}

func Read(path string) (Certificate, error) {
	file, err := os.Open(path)
	if err != nil {
		return Certificate{}, err
	}
	defer file.Close()
	payload, err := io.ReadAll(io.LimitReader(file, MaxCertificateSize+1))
	if err != nil || len(payload) > MaxCertificateSize {
		return Certificate{}, errors.New("Сертификат слишком большой или недоступен")
	}
	block, _ := pem.Decode(payload)
	if block == nil || block.Type != "CERTIFICATE" {
		return Certificate{}, errors.New("неверный PEM сертификата")
	}
	leaf, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return Certificate{}, err
	}
	domains := append([]string{}, leaf.DNSNames...)
	for _, address := range leaf.IPAddresses {
		domains = append(domains, address.String())
	}
	return Certificate{Path: filepath.ToSlash(path), Domains: domains, NotAfter: leaf.NotAfter.UTC().Format(time.RFC3339), Expired: time.Now().After(leaf.NotAfter) || time.Now().Before(leaf.NotBefore), PinSHA256: security.Hash(string(leaf.Raw)), leaf: leaf}, nil
}
