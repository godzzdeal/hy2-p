package releases

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

func (client *Client) Download(ctx context.Context, asset Asset, directory string) (string, error) {
	expected := strings.TrimPrefix(asset.Digest, "sha256:")
	if len(expected) != 64 {
		return "", errors.New("отсутствует SHA-256")
	}
	if _, err := hex.DecodeString(expected); err != nil {
		return "", errors.New("некорректный SHA-256")
	}
	if err := os.MkdirAll(directory, 0700); err != nil {
		return "", err
	}
	response, err := client.get(ctx, asset.URL)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	temporary, err := os.CreateTemp(directory, "download-*")
	if err != nil {
		return "", err
	}
	defer os.Remove(temporary.Name())
	defer temporary.Close()
	digest := sha256.New()
	size, err := io.Copy(io.MultiWriter(temporary, digest), io.LimitReader(response.Body, MaxBinarySize+1))
	if err != nil {
		return "", err
	}
	if size > MaxBinarySize || size != asset.Size {
		return "", errors.New("размер загруженного файла не совпадает с релизом")
	}
	if hex.EncodeToString(digest.Sum(nil)) != expected {
		return "", errors.New("SHA-256 не совпадает: файл отклонён")
	}
	if err = temporary.Chmod(0700); err != nil {
		return "", err
	}
	if err = temporary.Sync(); err != nil {
		return "", err
	}
	if err = temporary.Close(); err != nil {
		return "", err
	}
	suffix := ""
	if runtime.GOOS == "windows" {
		suffix = ".exe"
	}
	destination := filepath.Join(directory, "hysteria-"+expected+suffix)
	// Content-addressed files are immutable; a running version is never overwritten.
	if _, err = os.Stat(destination); err == nil {
		if err = Verify(destination, asset.Digest); err == nil {
			return destination, nil
		}
		return "", err
	}
	if err = os.Rename(temporary.Name(), destination); err != nil {
		return "", err
	}
	return destination, nil
}
func Verify(path, expected string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	digest := sha256.New()
	if _, err = io.Copy(digest, io.LimitReader(file, MaxBinarySize+1)); err != nil {
		return err
	}
	if "sha256:"+hex.EncodeToString(digest.Sum(nil)) != expected {
		return errors.New("контрольная сумма сохранённого ядра не совпадает")
	}
	return nil
}
