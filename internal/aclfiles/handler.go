package aclfiles

import (
	"errors"
	"hy2-panel/internal/transport"
	"io"
	"mime"
	"net/http"
	"time"
)

const UploadTimeout = 2 * time.Minute

func Handler(data string) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		kind := request.URL.Query().Get("kind")
		limit, err := Limit(kind)
		if err != nil {
			transport.Fail(writer, err, 400)
			return
		}
		controller := http.NewResponseController(writer)
		if err := controller.SetReadDeadline(time.Now().Add(UploadTimeout)); err != nil && !errors.Is(err, http.ErrNotSupported) {
			transport.Fail(writer, err, 500)
			return
		}
		if err := controller.SetWriteDeadline(time.Now().Add(UploadTimeout)); err != nil && !errors.Is(err, http.ErrNotSupported) {
			transport.Fail(writer, err, 500)
			return
		}
		media, _, _ := mime.ParseMediaType(request.Header.Get("Content-Type"))
		var path string
		if media == "application/json" {
			var input struct {
				URL string `json:"url"`
			}
			if err = transport.Decode(writer, request, &input); err == nil {
				path, err = Download(request.Context(), data, kind, input.URL)
			}
		} else {
			request.Body = http.MaxBytesReader(writer, request.Body, limit+MaxOverhead)
			reader, readError := request.MultipartReader()
			if readError != nil {
				transport.Fail(writer, errors.New("Выберите файл для загрузки"), 400)
				return
			}
			part, partError := reader.NextPart()
			if partError != nil || part.FormName() != "file" {
				transport.Fail(writer, errors.New("Выберите один файл"), 400)
				return
			}
			path, err = Store(data, kind, part)
			part.Close()
			if err == nil {
				if extra, nextError := reader.NextPart(); nextError != io.EOF {
					if extra != nil {
						extra.Close()
					}
					err = errors.New("Отправьте один файл за раз")
				}
			}
		}
		if err != nil {
			transport.Fail(writer, err, 422)
			return
		}
		transport.Respond(writer, map[string]string{"path": path})
	}
}
