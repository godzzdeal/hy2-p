package server

import (
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"hy2-panel/internal/acmehttp/gateway"
	"hy2-panel/internal/auth"
	"hy2-panel/internal/configuration"
	"hy2-panel/internal/core"
	"hy2-panel/internal/cryptovault"
	deviceapi "hy2-panel/internal/devices/integration"
	groupapi "hy2-panel/internal/groups/integration"
	"hy2-panel/internal/instances"
	instanceapi "hy2-panel/internal/instances/api"
	"hy2-panel/internal/security"
	"hy2-panel/internal/server/bootstrap"
	"hy2-panel/internal/subscriptions"
	"hy2-panel/internal/subscriptions/announcement"
	"hy2-panel/internal/systemmetrics"
	"hy2-panel/internal/traffic"
	"hy2-panel/internal/transfer"
	"hy2-panel/internal/transport"
	"hy2-panel/internal/transport/frontend"
	useraccess "hy2-panel/internal/useraccess/integration"
	"hy2-panel/internal/users"
	"hy2-panel/internal/websettings"
	"log"
	"net/http"
	"os"
	"strings"
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
	defer web.Close()
	db, err := bootstrap.OpenDatabase(data, bootstrap.InitialConfiguration(web.Current()))
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
	traffic, err := traffic.New(data, registry)
	if err != nil {
		return err
	}
	users := &users.Handler{DB: db, Kick: registry.Kick, Allow: traffic.Allowed, Vault: vault}
	access, err := useraccess.Open(data, registry, users)
	if err != nil {
		return err
	}
	devices, err := deviceapi.Open(data, users, registry.Kick)
	if err != nil {
		return err
	}
	groups, err := groupapi.Open(data, registry, users, access, devices, traffic)
	if err != nil {
		return err
	}
	access.AllowIdentity = devices.AllowedIdentity
	access.Sources, access.Observe = devices.Store.Sources, devices.Store.Observe
	defer func() {
		if err := devices.Store.Flush(); err != nil {
			log.Printf("flush device metadata: %v", err)
		}
	}()
	metrics := systemmetrics.New(systemmetrics.Options{Data: data})
	stopBackground := background(monitorContext, traffic.Run, devices.Store.Run, access.Run, metrics.Run)
	defer stopBackground()
	auth, err := auth.Open(passwordHash, security.Env("PANEL_SECURE_COOKIE", "false") == "true" || web.Active().Mode != "http", data, security.Env("PANEL_ADMIN_USERNAME", "admin"))
	if err != nil {
		return err
	}
	announcements, err := announcement.Open(data)
	if err != nil {
		return err
	}
	users.DisplayName = announcements.UserName
	subscriptions := &subscriptions.Handler{Announcements: announcements, DB: db, Users: users, Sources: instanceapi.Profiles(registry), AllowCore: access.Allows, DeviceLimit: devices.Store.Limit, PrepareSubscription: devices.Prepare, PublicURL: strings.TrimRight(web.Active().URL(), "/")}
	transfer := &transfer.Service{Users: users, Registry: registry, Groups: groups.Store, Access: access.Store, Devices: devices.Store, Traffic: traffic}
	frontend, err := frontend.New(os.Getenv("PANEL_FRONTEND_URL"))
	if err != nil {
		return err
	}
	public := httpServer(web.Active().Address(), routes(auth, users, registry, subscriptions, traffic, web, access, devices, groups, transfer, metrics, frontend.Handler()))
	tlsConfig, challenge, err := web.TLS()
	if err != nil {
		return err
	}
	if os.Getenv("PANEL_CONTAINER") == "true" {
		challenge = gateway.ServerFor(web.Active().ListenHost(), web.Active().ChallengePort, challenge, instanceapi.ACMESources(registry))
	}
	public.TLSConfig = tlsConfig
	internalMux := http.NewServeMux()
	if err := registerLocalTransfer(internalMux, data, transfer); err != nil {
		return err
	}
	internalMux.HandleFunc("GET /health", frontend.Health)
	internalMux.HandleFunc("GET /deployment", instanceapi.Handler{Registry: registry}.Deployment)
	internalMux.HandleFunc("POST /auth", access.Authenticate)
	internalMux.HandleFunc("POST /auth/{instance}", access.Authenticate)
	internal := httpServer(transport.InternalAddress(), internalMux)
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
	return awaitShutdown(failures, servers)
}
