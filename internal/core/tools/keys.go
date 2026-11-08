package tools

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/pem"
	"errors"
	"io"
	"os"
)

const MaxKeySize = 1 << 20

type ECH struct {
	KeyPath    string `json:"keyPath"`
	ConfigList string `json:"configList"`
}

// Only the public ECH CONFIGS block may leave the server.
func Inspect(path string) (ECH, error) {
	file, err := os.Open(path)
	if err != nil {
		return ECH{}, errors.New("Не удалось прочитать файл ECH")
	}
	defer file.Close()
	payload, err := io.ReadAll(io.LimitReader(file, MaxKeySize+1))
	if err != nil || len(payload) > MaxKeySize {
		return ECH{}, errors.New("Файл ECH слишком большой или недоступен")
	}
	for len(payload) > 0 {
		block, rest := pem.Decode(payload)
		if block == nil {
			break
		}
		payload = rest
		if block.Type != "ECH CONFIGS" {
			continue
		}
		if len(block.Bytes) < 3 || int(binary.BigEndian.Uint16(block.Bytes[:2])) != len(block.Bytes)-2 {
			return ECH{}, errors.New("Повреждён публичный список ECH")
		}
		return ECH{KeyPath: path, ConfigList: base64.StdEncoding.EncodeToString(block.Bytes)}, nil
	}
	return ECH{}, errors.New("В файле нет публичного блока ECH CONFIGS. ACME-сертификат не содержит ключей ECH")
}
