package profiles

import (
	"hy2-panel/internal/cryptovault"
	"sync"
)

type Settings struct {
	AuthMode           string `json:"authMode,omitempty"`
	Host               string `json:"host"`
	Port               string `json:"port"`
	SNI                string `json:"sni"`
	PinSHA256          string `json:"pinSHA256,omitempty"`
	PinFromCertificate bool   `json:"pinFromCertificate,omitempty"`
	Config             string `json:"config"`
}
type Revision struct {
	ID       int64    `json:"id"`
	Created  string   `json:"created"`
	Settings Settings `json:"settings"`
}
type Store struct {
	Directory string
	Vault     *cryptovault.Vault
	mu        sync.Mutex
}
