package frontend

import (
	"context"
	"io"
	"net/http"
)

var healthClient = &http.Client{
	Timeout:       healthTimeout,
	CheckRedirect: func(request *http.Request, via []*http.Request) error { return http.ErrUseLastResponse },
}

func (client *Client) Health(writer http.ResponseWriter, request *http.Request) {
	if client.address == "" {
		writer.WriteHeader(http.StatusNoContent)
		return
	}
	ctx, cancel := context.WithTimeout(request.Context(), healthTimeout)
	defer cancel()
	probe, err := http.NewRequestWithContext(ctx, http.MethodHead, client.address, nil)
	if err != nil {
		unavailable(writer, request)
		return
	}
	response, err := healthClient.Do(probe)
	if err != nil {
		unavailable(writer, request)
		return
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode != http.StatusOK {
		unavailable(writer, request)
		return
	}
	writer.WriteHeader(http.StatusNoContent)
}
