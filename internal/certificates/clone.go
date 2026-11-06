package certificates

import (
	"bytes"
	"errors"
	"gopkg.in/yaml.v3"
	"hy2-panel/internal/configuration"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// Copy managed PEM files so deleting the source core cannot break its clone.
func Clone(settings configuration.Settings, root, destination string) (configuration.Settings, error) {
	var document yaml.Node
	if err := yaml.Unmarshal([]byte(settings.Config), &document); err != nil {
		return settings, err
	}
	if len(document.Content) == 0 {
		return settings, nil
	}
	tls := property(document.Content[0], "tls")
	if tls == nil {
		return settings, nil
	}
	changed := false
	for _, field := range []string{"cert", "key", "clientCA"} {
		node := property(tls, field)
		if node == nil || node.Kind != yaml.ScalarNode {
			continue
		}
		owned, err := managed(root, node.Value)
		if err != nil {
			return settings, err
		}
		if !owned {
			continue
		}
		path := filepath.Join(destination, "certificates", "cloned", field+".pem")
		if err := copyPEM(node.Value, path); err != nil {
			return settings, err
		}
		node.Value = filepath.ToSlash(path)
		changed = true
	}
	if !changed {
		return settings, nil
	}
	var buffer bytes.Buffer
	encoder := yaml.NewEncoder(&buffer)
	encoder.SetIndent(2)
	if err := encoder.Encode(&document); err != nil {
		return settings, err
	}
	settings.Config = buffer.String()
	return settings, nil
}
func property(mapping *yaml.Node, key string) *yaml.Node {
	if mapping.Kind != yaml.MappingNode {
		return nil
	}
	for index := 0; index+1 < len(mapping.Content); index += 2 {
		if mapping.Content[index].Value == key {
			return mapping.Content[index+1]
		}
	}
	return nil
}
func managed(root, path string) (bool, error) {
	base, err := filepath.Abs(root)
	if err != nil {
		return false, err
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return false, err
	}
	relative, err := filepath.Rel(base, absolute)
	if err != nil || !filepath.IsLocal(relative) {
		return false, nil
	}
	return strings.HasPrefix(relative, "instances"+string(filepath.Separator)) ||
		strings.HasPrefix(relative, "certificates"+string(filepath.Separator)), nil
}
func copyPEM(source, destination string) error {
	file, err := os.Open(source)
	if err != nil {
		return err
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, MaxCertificateSize+1))
	if err != nil {
		return err
	}
	if len(data) > MaxCertificateSize {
		return errors.New("Файл сертификата слишком большой для копирования")
	}
	if err := os.MkdirAll(filepath.Dir(destination), 0700); err != nil {
		return err
	}
	return os.WriteFile(destination, data, 0600)
}
