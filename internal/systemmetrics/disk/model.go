package disk

type Usage struct {
	Managed    bool   `json:"managed"`
	Data       uint64 `json:"data"`
	Backups    uint64 `json:"backups"`
	Releases   uint64 `json:"releases"`
	Other      uint64 `json:"other"`
	Images     uint64 `json:"images"`
	Archives   uint64 `json:"archives"`
	ImageCount int    `json:"imageCount"`
	Updated    int64  `json:"updated"`
	Complete   bool   `json:"complete"`
	Message    string `json:"message,omitempty"`
}

type Options struct{ Data, Root string }
