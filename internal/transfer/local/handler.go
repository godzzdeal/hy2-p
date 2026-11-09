package local

import (
	"crypto/subtle"
	"errors"
	"hy2-panel/internal/transport"
	"net/http"
)

// Loopback is not an authorization boundary: VPN clients can proxy to it.
// Only the in-container CLI, which can read its private token file, may call here.
func New(data string, download, importer http.HandlerFunc) (http.Handler, error) {
	token, err := createToken(data)
	if err != nil {
		return nil, err
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /transfer", download)
	mux.HandleFunc("POST /transfer/{mode}", importer)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+token)) != 1 {
			transport.Fail(w, errors.New("Доступ запрещён"), http.StatusUnauthorized)
			return
		}
		mux.ServeHTTP(w, r)
	}), nil
}
