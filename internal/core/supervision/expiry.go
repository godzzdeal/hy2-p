package supervision

import (
	"context"
	"database/sql"
	"hy2-panel/internal/users"
	"time"
)

const ExpiryInterval = 30 * time.Second

func ExpiryLoop(ctx context.Context, db *sql.DB, running func() bool, kick func(string)) {
	ticker := time.NewTicker(ExpiryInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		if !running() {
			continue
		}
		rows, err := db.Query("SELECT id,name,enabled,expires,created,password,token FROM users WHERE enabled=0 OR expires<>''")
		if err != nil {
			continue
		}
		ids := []string{}
		for rows.Next() {
			user, err := users.Scan(rows)
			if err == nil && !users.Active(user) {
				ids = append(ids, user.ID)
			}
		}
		rows.Close()
		for _, id := range ids {
			kick(id)
		}
	}
}
