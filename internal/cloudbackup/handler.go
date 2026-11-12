package cloudbackup

import (
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/transport"
	"net/http"
	"path/filepath"
	"sync"
)

func Host(root string, mu *sync.Mutex, isBusy func() bool) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		current, err := Read(root)
		if err != nil {
			transport.Fail(writer, errors.New("Не удалось прочитать настройки резервного копирования"), 500)
			return
		}
		if request.Method == http.MethodPut {
			if isBusy() {
				transport.Fail(writer, errors.New("Дождитесь завершения обслуживания панели"), 409)
				return
			}
			var input Config
			if err = transport.Decode(writer, request, &input); err != nil {
				transport.Fail(writer, err, 400)
				return
			}
			if input.ConfigText == "" {
				input.ConfigText = current.ConfigText
			}
			if err = Validate(input); err != nil {
				transport.Fail(writer, err, 400)
				return
			}
			if err = records.Write(filepath.Join(root, "cloud-backup"), "settings", input); err != nil {
				transport.Fail(writer, errors.New("Не удалось сохранить настройки резервного копирования"), 500)
				return
			}
			current = input
		}
		transport.Respond(writer, map[string]any{"destination": current.Destination, "hasConfig": current.ConfigText != ""})
	}
}
