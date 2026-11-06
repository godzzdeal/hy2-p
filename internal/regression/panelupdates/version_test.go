package panelupdates_test

import (
	"context"
	"fmt"
	"testing"
)

func TestStableVersionsCompareNumerically(t *testing.T) {
	for _, input := range []struct{ current, latest, state string }{
		{"v0.4.0", "v0.4.1", "update_available"},
		{"v0.9.9", "v0.10.0", "update_available"},
		{"v0.9.10", "v0.9.9", "ahead"},
		{"v1.0.0", "v0.99.99", "ahead"},
		{"v0.4.1", "v0.4.1", "current"},
		{"local", "v0.4.1", "unknown"},
	} {
		t.Run(input.current+"-"+input.latest, func(t *testing.T) {
			service := fixture(input.current, fmt.Sprintf(`{"tag_name":%q}`, input.latest))
			result, err := service.Check(context.Background())
			if err != nil || result.State != input.state || result.Latest != input.latest {
				t.Fatalf("got %+v, %v; want %s", result, err, input.state)
			}
		})
	}
}
func TestUnpublishedAndInvalidReleaseTagsAreRejected(t *testing.T) {
	for _, body := range []string{
		`{"tag_name":"v0.5.0","draft":true}`,
		`{"tag_name":"v0.5.0","prerelease":true}`,
		`{"tag_name":"v0.5.0-beta.1"}`,
		`{"tag_name":"v0.05.0"}`,
		`{"tag_name":"https://example.com"}`,
		`not JSON`,
	} {
		if _, err := fixture("v0.4.0", body).Check(context.Background()); err == nil {
			t.Fatalf("accepted %s", body)
		}
	}
}
