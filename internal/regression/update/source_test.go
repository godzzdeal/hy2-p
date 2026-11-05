package update_test

import (
	"context"
	"errors"
	"hy2-panel/internal/releases"
)

type testSource struct{ failDownload bool }

func (source *testSource) List(context.Context) ([]releases.Version, error) {
	return []releases.Version{{Tag: "app/v2.13.0", Available: true}}, nil
}
func (source *testSource) Resolve(context.Context, string) (releases.Asset, error) {
	return releases.Asset{}, nil
}
func (source *testSource) Download(context.Context, releases.Asset, string) (string, error) {
	if source.failDownload {
		return "", errors.New("checksum mismatch")
	}
	return "candidate", nil
}
