package server

import (
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/acmehttp/gateway"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core"
	"hy2-panel/internal/core/supervision"
	"hy2-panel/internal/cryptovault"
	deviceapi "hy2-panel/internal/devices/integration"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"hy2-panel/internal/security"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/traffic"
	useraccess "hy2-panel/internal/useraccess/integration"
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
	monitorContext, cancelMonitor := context.WithCancel(context.Background())
	defer cancelMonitor()
	registry, err := instances.Open(monitorContext, data, db, vault, config, core)
	if err != nil {
		return err
	}
	defer registry.Close()
	traffic, err := traffic.New(data, core.Secret, registry)
	if err != nil {
		return err
	}
	go traffic.Run(monitorContext)
	users := &users.Handler{DB: db, Kick: registry.Kick, Allow: traffic.Allowed, Vault: vault}
	access, err := useraccess.Open(data, registry, users)
	if err != nil {
		return err
	}
	devices, err := deviceapi.Open(data, users, registry.Kick)
	if err != nil {
		return err
	}
	go devices.Store.Run(monitorContext)
	access.AllowIdentity = devices.AllowedIdentity
	access.Sources, access.Observe = devices.Store.Sources, devices.Store.Observe
	go access.Run(monitorContext)
	defer devices.Store.Flush()
	auth, err := auth.Open(passwordHash, security.Env("PANEL_SECURE_COOKIE", "false") == "true" || web.Active().Mode != "http", data, security.Env("PANEL_ADMIN_USERNAME", "admin"))
	if err != nil {
		return err
	}
	announcements, err := announcement.Open(data)
	if err != nil {
		return err
	}
	subscriptions := &subscriptions.Handler{Announcements: announcements, DB: db, Users: users, Sources: instanceapi.Profiles(registry), AllowCore: access.Store.Allows, DeviceLimit: devices.Store.Limit, PrepareSubscription: devices.Prepare, PublicURL: strings.TrimRight(web.Active().URL(), "/")}
	public := httpServer(web.Active().Address(), routes(auth, users, registry, subscriptions, traffic, web, access, devices))
	tlsConfig, challenge, err := web.TLS()
	if err != nil {
		return err
	}
	if os.Getenv("PANEL_CONTAINER") == "true" {
		challenge = gateway.ServerFor(web.Active().Host, web.Active().ChallengePort, challenge, instanceapi.ACMESources(registry))
	}
	public.TLSConfig = tlsConfig
	internalMux := http.NewServeMux()
	internalMux.HandleFunc("GET /health", func(writer http.ResponseWriter, request *http.Request) { writer.WriteHeader(http.StatusNoContent) })
	internalMux.HandleFunc("GET /deployment", instanceapi.Handler{Registry: registry}.Deployment)
	internalMux.HandleFunc("POST /auth", access.Authenticate)
	internalMux.HandleFunc("POST /auth/{instance}", access.Authenticate)
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
	go supervision.ExpiryLoop(monitorContext, db, registry.Running, registry.Kick)
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
