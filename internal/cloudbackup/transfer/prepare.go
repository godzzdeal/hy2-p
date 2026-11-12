package transfer

import (
	"context"
	"hy2-panel/internal/cloudbackup/accounts"
	"hy2-panel/internal/cloudbackup/accounts/config"
	"hy2-panel/internal/cloudbackup/accounts/oauth"
)

// Called by the isolated maintenance worker while its deployment lock is held.
func Prepare(ctx context.Context, root, id string) (config.Transfer, error) {
	catalog, err := accounts.Read(root)
	if err != nil {
		return config.Transfer{}, err
	}
	index, err := accounts.Find(catalog, id)
	if err != nil {
		return config.Transfer{}, err
	}
	account := &catalog.Accounts[index]
	if account.Token != nil {
		if err := oauth.Refresh(ctx, root, account); err != nil {
			return config.Transfer{}, err
		}
		if err := accounts.Save(root, catalog); err != nil {
			return config.Transfer{}, err
		}
	}
	return config.Render(*account)
}
