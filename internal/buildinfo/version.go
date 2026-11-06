package buildinfo

import (
	_ "embed"
	"hy2-panel/internal/transport"
	"net/http"
	"strings"
)

//go:embed VERSION
var version string

// Revision is supplied by the Docker build from the verified source commit.
var Revision = "local"

func Version() string { return strings.TrimSpace(version) }

func Read(writer http.ResponseWriter, request *http.Request) {
	transport.Respond(writer, map[string]string{"version": Version(), "revision": Revision})
}
