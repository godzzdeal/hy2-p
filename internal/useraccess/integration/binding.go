package integration

import (
	"context"
	"hy2-panel/internal/core/statistics"
	"hy2-panel/internal/instances"
	"hy2-panel/internal/security"
	"hy2-panel/internal/useraccess"
	"net/http"
	"sync"
	"time"
)

const EnforcementInterval = 5 * time.Second

// Recheck live sessions so a concurrent authentication cannot bypass a revocation.
func (handler *Handler) Run(ctx context.Context) {
	ticker := time.NewTicker(EnforcementInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		active := []*instances.Instance{}
		ids := []string{}
		for _, instance := range handler.Registry.All() {
			if !instance.Core.Running() {
				continue
			}
			settings, err := instance.Config.Get()
			if err == nil && settings.AuthMode == "native" {
				continue
			}
			active = append(active, instance)
			ids = append(ids, instance.ID)
		}
		if handler.Sources != nil {
			handler.Sources(ids)
		}
		var workers sync.WaitGroup
		for _, instance := range active {
			workers.Add(1)
			go func(instance *instances.Instance) { defer workers.Done(); handler.enforce(ctx, instance) }(instance)
		}
		workers.Wait()
	}
}
func (handler *Handler) enforce(ctx context.Context, instance *instances.Instance) {
	client := statistics.Client{Address: instance.Core.StatsURL(), Secret: instance.Core.Secret}
	online, err := client.Online(ctx)
	if err != nil {
		if handler.Observe != nil {
			handler.Observe(instance.ID, nil, false)
		}
		return
	}
	valid := map[string]int{}
	for identity, count := range online {
		if count > 0 && (!handler.Allows(security.ParentUser(identity), instance.ID) || (handler.AllowIdentity != nil && !handler.AllowIdentity(identity))) {
			instance.Core.KickIdentity(identity)
		} else {
			valid[identity] = count
		}
	}
	if handler.Observe != nil {
		handler.Observe(instance.ID, valid, true)
	}
}
func (handler *Handler) Authenticate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("instance")
	if id == "" {
		id = instances.DefaultID
	}
	handler.Registry.WithCore(id, w, r, func(instance *instances.Instance) http.HandlerFunc {
		return handler.Users.AuthenticateFor(instance.ID)
	})
}
func (handler *Handler) revoke(user string, policy useraccess.Policy) {
	var workers sync.WaitGroup
	for _, instance := range handler.Registry.All() {
		if policy.Allows(instance.ID) || !instance.Core.Running() {
			continue
		}
		workers.Add(1)
		go func(instance *instances.Instance) { defer workers.Done(); instance.Core.Kick(user) }(instance)
	}
	workers.Wait()
}
