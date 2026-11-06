package backends

import (
	"context"
	"net/http"
)

// Multiple cores can renew the same domain: only the core holding this token answers.
func (handler Handler) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	ctx, cancel := context.WithTimeout(request.Context(), Timeout)
	defer cancel()
	sources := handler.Sources()
	results := make(chan response, len(sources))
	pending := 0
	for _, source := range sources {
		if !matches(source, request.Host) {
			continue
		}
		pending++
		go func(source Source) { results <- forward(ctx, request, source.Port) }(source)
	}
	for pending > 0 {
		select {
		case result := <-results:
			pending--
			if result.status != http.StatusOK {
				continue
			}
			writer.Header().Set("Content-Type", "text/plain; charset=utf-8")
			writer.WriteHeader(http.StatusOK)
			if request.Method != http.MethodHead {
				writer.Write(result.body)
			}
			return
		case <-ctx.Done():
			http.NotFound(writer, request)
			return
		}
	}
	http.NotFound(writer, request)
}
