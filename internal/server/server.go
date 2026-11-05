package server

import (
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/acmehttp/gateway"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/certificates"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core"
	"hy2-panel/internal/cryptovault"
	"hy2-panel/internal/security"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/users"
	"hy2-panel/internal/websettings"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

func Run() error {
	password := os.Getenv("PANEL_ADMIN_PASSWORD")
	if len(password) < 16 || password == "replace-with-a-long-unique-password" {
		return errors.New("set a unique PANEL_ADMIN_PASSWORD of at least 16 characters")
	}
	data := security.Env("PANEL_DATA", "data")
	web, err := websettings.Open(data, security.Env("PANEL_LISTEN", "127.0.0.1:8080"), security.Env("PANEL_PUBLIC_URL", ""))
	if err != nil {
		return err
	}
	db, err := openDatabase(data)
	if err != nil {
		return err
	}
	defer db.Close()
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	vault, err := cryptovault.Open(data)
	if err != nil {
		return err
	}
	config := &configuration.Handler{DB: db, Vault: vault}
	core, err := core.New(db, config, data, security.Hash(string(passwordHash)))
	if err != nil {
		return err
	}
	defer core.Stop()
	monitorContext, cancelMonitor := context.WithCancel(context.Background())
	defer cancelMonitor()
	go core.Watchdog.Run(monitorContext)
	traffic, err := traffic.New(data, core.Secret, core)
	if err != nil {
		return err
	}
	go traffic.Run(monitorContext)
	users := &users.Handler{DB: db, Kick: core.Kick, Allow: traffic.Allowed, Vault: vault}
	auth, err := auth.Open(passwordHash, security.Env("PANEL_SECURE_COOKIE", "false") == "true" || web.Active().Mode != "http", data, security.Env("PANEL_ADMIN_USERNAME", "admin"))
	if err != nil {
		return err
	}
	announcements, err := announcement.Open(data)
	if err != nil {
		return err
	}
	subscriptions := &subscriptions.Handler{Announcements: announcements, DB: db, Users: users, Config: config, PublicURL: strings.TrimRight(web.Active().URL(), "/")}
	certificates := &certificates.Handler{Data: data, Config: config}
	public := httpServer(web.Active().Address(), routes(auth, users, config, core, subscriptions, traffic, web, certificates))
	tlsConfig, challenge, err := web.TLS()
	if err != nil {
		return err
	}
	if os.Getenv("PANEL_CONTAINER") == "true" {
		challenge = gateway.Server(web.Active().Host, web.Active().ChallengePort, challenge, config)
	}
	public.TLSConfig = tlsConfig
	internalMux := http.NewServeMux()
	internalMux.HandleFunc("GET /health", func(writer http.ResponseWriter, request *http.Request) { writer.WriteHeader(http.StatusNoContent) })
	internalMux.HandleFunc("GET /deployment", gateway.Metadata(config))
	internalMux.HandleFunc("POST /auth", users.Authenticate)
	internal := httpServer("127.0.0.1:8081", internalMux)
	failures := make(chan error, 3)
	servers := []*http.Server{public, internal}
	if challenge != nil {
		servers = append(servers, challenge)
	}
	for _, server := range servers {
		go func() {
			var err error
			if server == public && tlsConfig != nil {
				err = server.ListenAndServeTLS("", "")
			} else {
				err = server.ListenAndServe()
			}
			if !errors.Is(err, http.ErrServerClosed) {
				failures <- err
			}
		}()
	}
	log.Printf("Panel listening on %s", public.Addr)
	go core.ExpiryLoop(monitorContext)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(quit)
	select {
	case <-quit:
	case err = <-failures:
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	public.Shutdown(ctx)
	internal.Shutdown(ctx)
	if challenge != nil {
		challenge.Shutdown(ctx)
	}
	return err
}
func httpServer(address string, handler http.Handler) *http.Server {
	return &http.Server{Addr: address, Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
}
