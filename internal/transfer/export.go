package transfer

import "hy2-panel/internal/transfer/model"

func (service *Service) Export() (model.Bundle, error) {
	groupSnapshot := service.Groups.Snapshot()
	bundle := model.Bundle{Format: model.Format, Profiles: []model.Profile{}, Users: []model.User{}, Groups: groupSnapshot.Groups}
	for _, definition := range service.Registry.Definitions() {
		if definition.Removing {
			continue
		}
		instance, err := service.Registry.Get(definition.ID)
		if err != nil {
			return bundle, err
		}
		settings, err := instance.Config.Get()
		if err != nil {
			return bundle, err
		}
		bundle.Profiles = append(bundle.Profiles, model.Profile{ID: definition.ID, Name: definition.Name, Settings: settings})
	}
	entries, err := service.Users.All()
	if err != nil {
		return bundle, err
	}
	memberships, usage := groupSnapshot.Memberships, service.Traffic.Snapshot().Users
	for _, entry := range entries {
		password, err := service.Users.Vault.OpenPassword(entry.Password)
		if err != nil {
			return bundle, err
		}
		bundle.Users = append(bundle.Users, model.User{ID: entry.ID, Name: entry.Name, Enabled: entry.Enabled,
			Expires: entry.Expires, Created: entry.Created, Password: password, Token: entry.Token,
			Group: memberships[entry.ID], Access: service.Access.Get(entry.ID), Usage: usage[entry.ID], DeviceLimit: service.Devices.Snapshot(entry.ID).Limit})
	}
	return bundle, nil
}
