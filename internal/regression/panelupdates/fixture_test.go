package panelupdates_test

import (
	"hy2-panel/internal/buildinfo/updates"
	"io"
	"net/http"
	"strings"
)

type transportFunc func(*http.Request) (*http.Response, error)

func (transport transportFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport(request)
}
func response(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}
}
func fixture(current, body string) *updates.Service {
	service := updates.New(current)
	service.HTTP.Transport = transportFunc(func(*http.Request) (*http.Response, error) {
		return response(http.StatusOK, body), nil
	})
	return service
}
