package accounts

import "time"

const Path = "/backup/storages"
const MaxAccounts = 12
const MaxConfigBytes = 256 << 10
const LegacyID = "legacy"

type Token struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token,omitempty"`
	TokenType    string    `json:"token_type"`
	Expiry       time.Time `json:"expiry"`
}

type Account struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Provider    string `json:"provider"`
	Folder      string `json:"folder"`
	ConfigText  string `json:"configText,omitempty"`
	Destination string `json:"destination,omitempty"`
	Token       *Token `json:"token,omitempty"`
	ClientID    string `json:"clientId,omitempty"`
	DriveID     string `json:"driveId,omitempty"`
	DriveType   string `json:"driveType,omitempty"`
}

type Catalog struct {
	Accounts []Account `json:"accounts"`
}
type Input struct {
	Action       string `json:"action"`
	ID           string `json:"id,omitempty"`
	Name         string `json:"name,omitempty"`
	Provider     string `json:"provider,omitempty"`
	Folder       string `json:"folder,omitempty"`
	Endpoint     string `json:"endpoint,omitempty"`
	Username     string `json:"username,omitempty"`
	Password     string `json:"password,omitempty"`
	AccessKey    string `json:"accessKey,omitempty"`
	SecretKey    string `json:"secretKey,omitempty"`
	Region       string `json:"region,omitempty"`
	ConfigText   string `json:"configText,omitempty"`
	Destination  string `json:"destination,omitempty"`
	Origin       string `json:"origin,omitempty"`
	State        string `json:"state,omitempty"`
	Code         string `json:"code,omitempty"`
	ClientID     string `json:"clientId,omitempty"`
	ClientSecret string `json:"clientSecret,omitempty"`
}

type Summary struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Provider string `json:"provider"`
	Folder   string `json:"folder"`
}

func Summaries(catalog Catalog) []Summary {
	result := make([]Summary, 0, len(catalog.Accounts))
	for _, account := range catalog.Accounts {
		result = append(result, Summary{account.ID, account.Name, account.Provider, account.Folder})
	}
	return result
}
