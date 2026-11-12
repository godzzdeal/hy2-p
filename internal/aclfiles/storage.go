package aclfiles

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"hy2-panel/internal/security"
	"io"
	"os"
	"path/filepath"
	"unicode/utf8"
)

const MaxRules int64 = 1 << 20
const MaxDatabase int64 = 128 << 20
const MaxOverhead int64 = 64 << 10
const Directory = "acl-files"

func Limit(kind string) (int64, error) {
	switch kind {
	case "file":
		return MaxRules, nil
	case "geoip", "geosite":
		return MaxDatabase, nil
	default:
		return 0, errors.New("Выберите acl.file, acl.geoip или acl.geosite")
	}
}

func Store(data, kind string, source io.Reader) (string, error) {
	limit, err := Limit(kind)
	if err != nil {
		return "", err
	}
	root, err := os.OpenRoot(data)
	if err != nil {
		return "", err
	}
	defer root.Close()
	if err = root.Mkdir(Directory, 0700); err != nil && !os.IsExist(err) {
		return "", err
	}
	info, err := root.Lstat(Directory)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return "", errors.New("Каталог файлов ACL недоступен")
	}
	temporary := filepath.Join(Directory, ".upload-"+security.Token())
	file, err := root.OpenFile(temporary, os.O_CREATE|os.O_EXCL|os.O_RDWR, 0600)
	if err != nil {
		return "", err
	}
	defer root.Remove(temporary)
	defer file.Close()
	hash := sha256.New()
	size, err := io.Copy(io.MultiWriter(file, hash), io.LimitReader(source, limit+1))
	if err != nil {
		return "", err
	}
	if size == 0 || size > limit {
		return "", errors.New("Файл пуст или превышает допустимый размер")
	}
	extension := ".dat"
	if kind == "file" {
		extension = ".txt"
		if _, err = file.Seek(0, io.SeekStart); err != nil {
			return "", err
		}
		payload, err := io.ReadAll(file)
		if err != nil {
			return "", err
		}
		if !utf8.Valid(payload) {
			return "", errors.New("Файл ACL должен быть текстом в UTF-8")
		}
		for _, value := range payload {
			if value == 0 {
				return "", errors.New("Файл ACL содержит двоичные данные")
			}
		}
	}
	if err = file.Sync(); err != nil {
		return "", err
	}
	if err = file.Close(); err != nil {
		return "", err
	}
	name := filepath.Join(Directory, kind+"-"+hex.EncodeToString(hash.Sum(nil))+extension)
	if err = root.Rename(temporary, name); err != nil {
		return "", err
	}
	return filepath.ToSlash(filepath.Join(data, name)), nil
}
