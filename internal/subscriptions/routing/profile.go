package routing

import (
	"encoding/base64"
	"encoding/json"
)

type Profile struct {
	Name           string   `json:"Name"`
	GlobalProxy    string   `json:"GlobalProxy"`
	DirectSites    []string `json:"DirectSites"`
	DirectIP       []string `json:"DirectIp"`
	ProxySites     []string `json:"ProxySites"`
	ProxyIP        []string `json:"ProxyIp"`
	BlockSites     []string `json:"BlockSites"`
	BlockIP        []string `json:"BlockIp"`
	DomainStrategy string   `json:"DomainStrategy"`
	UseChunkFiles  bool     `json:"UseChunkFiles"`
}

// Link is delivered only as metadata; the ordinary HY2 URI list stays unchanged.
func Link(settings Settings) string {
	if !settings.Enabled {
		if settings.HasProfile {
			return "happ://routing/off"
		}
		return ""
	}
	sites := make([]string, 0, len(settings.Domains))
	for _, domain := range settings.Domains {
		sites = append(sites, "domain:"+domain)
	}
	profile := Profile{Name: "HY2-P", GlobalProxy: "true", DirectSites: sites,
		DirectIP: []string{}, ProxySites: []string{}, ProxyIP: []string{}, BlockSites: []string{}, BlockIP: []string{},
		DomainStrategy: "AsIs", UseChunkFiles: true}
	data, _ := json.Marshal(profile) // This profile contains only strings and string slices.
	return "happ://routing/onadd/" + base64.StdEncoding.EncodeToString(data)
}
