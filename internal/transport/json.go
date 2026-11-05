package transport

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

func Respond(writer http.ResponseWriter, value any) {
	writer.Header().Set("Content-Type", "application/json")
	json.NewEncoder(writer).Encode(value)
}

func Fail(writer http.ResponseWriter, err error, n int) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(n)
	json.NewEncoder(writer).Encode(map[string]string{"error": err.Error()})
}

func Decode(writer http.ResponseWriter, request *http.Request, value any) error {
	request.Body = http.MaxBytesReader(writer, request.Body, 1<<20)
	d := json.NewDecoder(request.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(value); err != nil {
		return errors.New("Некорректные данные запроса")
	}
	if d.Decode(new(any)) != io.EOF {
		return errors.New("Лишние данные в запросе")
	}
	return nil
}
