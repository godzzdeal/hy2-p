package ech

import (
	"path/filepath"
	"strings"
)

func IsGenerated(data, path string) bool {
	root, err := filepath.EvalSymlinks(filepath.Join(data, "ech"))
	if err != nil {
		return false
	}
	resolved, err := filepath.EvalSymlinks(path)
	if err != nil {
		return false
	}
	relative, err := filepath.Rel(root, resolved)
	return err == nil && relative != "." && !strings.HasPrefix(relative, "..") && !filepath.IsAbs(relative)
}
