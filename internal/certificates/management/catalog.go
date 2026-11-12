package management

import (
	"errors"
	"hy2-panel/internal/certificates/files"
	"hy2-panel/internal/security"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

type Entry struct {
	files.Certificate
	ID           string `json:"id"`
	Source       string `json:"source"`
	InUse        bool   `json:"inUse"`
	CanDelete    bool   `json:"canDelete"`
	DeleteReason string `json:"deleteReason,omitempty"`
	FromSource   bool   `json:"-"`
}

func List(source, data string, references []Reference) (string, []Entry, error) {
	mode, sources, err := files.Sources(source, data)
	if err != nil {
		return "", nil, err
	}
	for index, path := range sources {
		sources[index] = filepath.Clean(path)
	}
	paths := append([]string{}, sources...)
	count := 0
	err = filepath.WalkDir(filepath.Join(data, "certificates"), func(path string, entry fs.DirEntry, walkError error) error {
		if walkError != nil {
			return walkError
		}
		count++
		if count > files.MaxCacheEntries {
			return errors.New("Слишком много файлов сертификатов")
		}
		if !entry.IsDir() && (strings.HasSuffix(path, ".crt") || entry.Name() == "cert.pem") {
			paths = append(paths, path)
		}
		return nil
	})
	if err != nil && !os.IsNotExist(err) {
		return "", nil, err
	}
	slices.Sort(paths)
	paths = slices.Compact(paths)
	result := make([]Entry, 0, len(paths))
	for _, path := range paths {
		certificate, err := files.Read(path)
		if err != nil {
			continue
		}
		entry := Entry{Certificate: certificate, ID: security.Hash(certificate.Path), Source: "tls", FromSource: slices.Contains(sources, path)}
		if mode == "acme" && entry.FromSource {
			entry.Source = "acme"
		}
		entry.CanDelete = owned(data, path)
		if !entry.CanDelete {
			entry.DeleteReason = "Файл находится вне каталога данных экземпляра или использует символьную ссылку"
		}
		for _, reference := range references {
			inUse, err := referenced(certificate, reference)
			if err != nil {
				return "", nil, err
			}
			entry.InUse = entry.InUse || inUse
			if inUse && reference.Running {
				entry.CanDelete = false
				entry.DeleteReason = "Сначала остановите экземпляры, использующие этот сертификат"
			}
		}
		result = append(result, entry)
	}
	return mode, result, nil
}
