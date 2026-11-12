package routing

import (
	"errors"
	"fmt"
	"golang.org/x/net/idna"
	"net"
	"strings"
)

const MaxDomains = 64
const MaxDomainBytes = 1800

type Settings struct {
	Enabled    bool     `json:"enabled"`
	Domains    []string `json:"domains"`
	HasProfile bool     `json:"hasProfile,omitempty"`
}

func Normalize(input Settings) (Settings, error) {
	if len(input.Domains) > MaxDomains {
		return Settings{}, fmt.Errorf("Прямой доступ: не более %d доменов", MaxDomains)
	}
	result := input
	result.Domains = []string{}
	seen := map[string]bool{}
	total := 0
	for _, value := range input.Domains {
		domain := strings.TrimSpace(value)
		if domain == "" {
			continue
		}
		domain = strings.TrimPrefix(domain, "*.")
		domain = strings.TrimSuffix(domain, ".")
		ascii, err := idna.Lookup.ToASCII(domain)
		domain = strings.ToLower(ascii)
		if err != nil || !validDomain(domain) {
			return Settings{}, fmt.Errorf("Прямой доступ: неверный домен «%s». Укажите имя без https://, пути и порта", value)
		}
		if seen[domain] {
			continue
		}
		seen[domain] = true
		total += len(domain)
		if total > MaxDomainBytes {
			return Settings{}, errors.New("Список доменов слишком большой для передачи через подписку")
		}
		result.Domains = append(result.Domains, domain)
	}
	if result.Enabled && len(result.Domains) == 0 {
		return Settings{}, errors.New("Добавьте хотя бы один домен для прямого доступа")
	}
	return result, nil
}

func validDomain(domain string) bool {
	if len(domain) > 253 || !strings.Contains(domain, ".") || net.ParseIP(domain) != nil {
		return false
	}
	for _, label := range strings.Split(domain, ".") {
		if len(label) == 0 || len(label) > 63 || label[0] == '-' || label[len(label)-1] == '-' {
			return false
		}
		for _, character := range label {
			if character != '-' && (character < 'a' || character > 'z') && (character < '0' || character > '9') {
				return false
			}
		}
	}
	return true
}
