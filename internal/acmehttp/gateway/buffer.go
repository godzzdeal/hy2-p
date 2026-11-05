package gateway

import (
	"bytes"
	"io"
	"net/http"
)

const MaxTokenResponse = 4096

type responseBuffer struct {
	headers http.Header
	body    bytes.Buffer
	status  int
}

func newBuffer() *responseBuffer {
	return &responseBuffer{headers: make(http.Header), status: http.StatusOK}
}
func (buffer *responseBuffer) Header() http.Header    { return buffer.headers }
func (buffer *responseBuffer) WriteHeader(status int) { buffer.status = status }
func (buffer *responseBuffer) Write(body []byte) (int, error) {
	if buffer.body.Len()+len(body) > MaxTokenResponse {
		return 0, io.ErrShortBuffer
	}
	return buffer.body.Write(body)
}
func (buffer *responseBuffer) flush(writer http.ResponseWriter) {
	for key, values := range buffer.headers {
		writer.Header()[key] = values
	}
	writer.WriteHeader(buffer.status)
	writer.Write(buffer.body.Bytes())
}
