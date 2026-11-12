package transfer

import (
	"context"
	"encoding/json"
	"errors"
	"hy2-panel/internal/cloudbackup/accounts"
	"io"
	"os"
)

func CLI(ctx context.Context, root string, arguments []string, output io.Writer) error {
	if len(arguments) < 2 || len(arguments) > 3 {
		return errors.New("expected cloud-config id or cloud-save id file")
	}
	if arguments[0] == "cloud-config" && len(arguments) == 2 {
		transfer, err := Prepare(ctx, root, arguments[1])
		if err != nil {
			return err
		}
		return json.NewEncoder(output).Encode(transfer)
	}
	if arguments[0] != "cloud-save" || len(arguments) != 3 {
		return errors.New("invalid cloud command")
	}
	catalog, err := accounts.Read(root)
	if err != nil {
		return err
	}
	index, err := accounts.Find(catalog, arguments[1])
	if err != nil {
		return err
	}
	if catalog.Accounts[index].Provider != "rclone" {
		return nil
	}
	file, err := os.Open(arguments[2])
	if err != nil {
		return err
	}
	defer file.Close()
	payload, err := io.ReadAll(io.LimitReader(file, accounts.MaxConfigBytes+1))
	if err != nil {
		return err
	}
	if len(payload) == 0 || len(payload) > accounts.MaxConfigBytes {
		return errors.New("invalid cloud configuration")
	}
	catalog.Accounts[index].ConfigText = string(payload)
	return accounts.Save(root, catalog)
}
