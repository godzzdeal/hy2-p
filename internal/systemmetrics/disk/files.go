package disk

import (
	"context"
	"hy2-panel/internal/systemmetrics/disk/images"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const MaxFiles = 250000

func Scan(ctx context.Context, options Options) Usage {
	result := Usage{Updated: time.Now().UnixMilli(), Complete: true, Managed: options.Root != ""}
	count := 0
	walk := func(root string, category string) {
		if root == "" {
			return
		}
		err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if err = ctx.Err(); err != nil {
				return err
			}
			count++
			if count > MaxFiles {
				return fs.ErrInvalid
			}
			if entry.IsDir() {
				if category == "root" && filepath.Clean(path) == filepath.Clean(options.Data) {
					return filepath.SkipDir
				}
				return nil
			}
			if entry.Type()&os.ModeSymlink != 0 {
				return nil
			}
			info, err := entry.Info()
			if err != nil {
				return err
			}
			if !info.Mode().IsRegular() {
				return nil
			}
			bytes := uint64(info.Size())
			kind := category
			if category == "root" {
				relative, err := filepath.Rel(root, path)
				if err != nil {
					return err
				}
				first := strings.Split(filepath.ToSlash(relative), "/")[0]
				switch first {
				case "backups":
					kind = "backups"
				case "releases":
					kind = "releases"
				case "image-archives":
					kind = "archives"
				default:
					kind = "other"
				}
			}
			switch kind {
			case "data":
				result.Data += bytes
			case "backups":
				result.Backups += bytes
			case "releases":
				result.Releases += bytes
			case "archives":
				result.Archives += bytes
			default:
				result.Other += bytes
			}
			return nil
		})
		if err != nil && !os.IsNotExist(err) {
			result.Complete = false
			result.Message = "Размер файлов подсчитан не полностью"
		}
	}
	walk(options.Data, "data")
	walk(options.Root, "root")
	if options.Root != "" {
		bytes, count, err := images.Measure(ctx, options.Root)
		if err == nil {
			result.Images = bytes
			result.ImageCount = count
		} else {
			result.Message = "Размер образов Docker недоступен"
			result.Complete = false
		}
	}
	return result
}
