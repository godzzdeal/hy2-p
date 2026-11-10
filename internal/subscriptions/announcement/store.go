package announcement

import (
	"encoding/base64"
	"errors"
	"hy2-panel/internal/records"
	"hy2-panel/internal/subscriptions/announcement/flags"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"unicode"
	"unicode/utf8"
)

const MaxProfileTitleLength = 25
const MaxTextLength = 200
const MaxUpdateHours = 168
const DefaultUpdateHours = 6

type Settings struct {
	DefaultUserFlag string `json:"defaultUserFlag,omitempty"`
	ProfileTitle    string `json:"profileTitle,omitempty"`
	Enabled         bool   `json:"enabled"`
	Text            string `json:"text"`
	UpdateInterval  int    `json:"updateInterval"`
}
type Store struct {
	mu        sync.RWMutex
	settings  Settings
	directory string
}

func Open(data string) (*Store, error) {
	store := &Store{settings: Settings{UpdateInterval: DefaultUpdateHours}, directory: filepath.Join(data, "subscriptions")}
	if err := records.Read(store.directory, "announcement", &store.settings); err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if err := validate(store.settings); err != nil {
		return nil, err
	}
	return store, nil
}
func validate(settings Settings) error {
	if !flags.Valid(settings.DefaultUserFlag) {
		return errors.New("выберите корректный флаг пользователей")
	}
	if !utf8.ValidString(settings.ProfileTitle) || utf8.RuneCountInString(settings.ProfileTitle) > MaxProfileTitleLength {
		return errors.New("название подписки: не более 25 символов")
	}
	if strings.IndexFunc(settings.ProfileTitle, unicode.IsControl) >= 0 {
		return errors.New("название подписки не должно содержать управляющие символы")
	}
	if utf8.RuneCountInString(settings.Text) > MaxTextLength {
		return errors.New("объявление: не более 200 символов")
	}
	if settings.Enabled && strings.TrimSpace(settings.Text) == "" {
		return errors.New("введите текст объявления")
	}
	if settings.UpdateInterval < 1 || settings.UpdateInterval > MaxUpdateHours {
		return errors.New("интервал обновления: от 1 до 168 часов")
	}
	return nil
}
func (store *Store) Current() Settings {
	store.mu.RLock()
	defer store.mu.RUnlock()
	return store.settings
}
func (store *Store) UserName(name string) string {
	return flags.Apply(name, store.Current().DefaultUserFlag)
}
func (store *Store) Headers(headers http.Header) {
	settings := store.Current()
	if settings.ProfileTitle != "" {
		headers.Set("profile-title", "base64:"+base64.StdEncoding.EncodeToString([]byte(settings.ProfileTitle)))
	}
	text := ""
	if settings.Enabled {
		text = settings.Text
	}
	headers.Set("announce", "base64:"+base64.StdEncoding.EncodeToString([]byte(text)))
	headers.Set("profile-update-interval", strconv.Itoa(settings.UpdateInterval))
}
