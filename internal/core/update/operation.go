package update

import (
	"context"
	"errors"
	"fmt"
	"hy2-panel/internal/releases"
	"time"
)

func (service *Service) Begin(tag string, rollback bool) error {
	if !service.runtime.TryLock() {
		return errors.New("другая операция с экземпляром уже выполняется")
	}
	service.mu.Lock()
	if rollback && service.state.Previous == nil {
		service.mu.Unlock()
		service.runtime.Unlock()
		return errors.New("предыдущая версия отсутствует")
	}
	if !rollback && !releases.VersionPattern.MatchString(tag) {
		service.mu.Unlock()
		service.runtime.Unlock()
		return errors.New("некорректная версия")
	}
	target := tag
	if rollback {
		target = service.state.Previous.Version
	}
	service.busy = true
	service.state.Last = Result{Phase: "downloading", Message: "Подготовка обновления", Target: target, Started: time.Now().UTC().Format(time.RFC3339)}
	service.mu.Unlock()
	go service.run(tag, rollback)
	return nil
}
func (service *Service) run(tag string, rollback bool) {
	defer func() { service.mu.Lock(); service.busy = false; service.runtime.Unlock(); service.mu.Unlock() }()
	ctx, cancel := context.WithTimeout(context.Background(), OperationTimeout)
	defer cancel()
	service.mu.Lock()
	original := service.state
	service.mu.Unlock()
	wasRunning := service.runtime.Running()
	candidate, err := service.prepare(ctx, tag, rollback, original)
	if err != nil {
		service.finishError(original, err)
		return
	}
	pending := original
	pending.Pending = &candidate
	if err = service.commit(pending); err != nil {
		service.finishError(original, err)
		return
	}
	service.progress("restarting", "Пробный запуск и проверка API экземпляра")
	if err = service.runtime.Activate(ctx, candidate.Path, true); err != nil {
		service.restore(original, wasRunning, err)
		return
	}
	if !wasRunning {
		if err = service.runtime.Activate(ctx, candidate.Path, false); err != nil {
			service.restore(original, wasRunning, err)
			return
		}
	}
	next := State{Current: candidate, Previous: &original.Current, Last: original.Last}
	if original.Current.Version == "Не установлено" {
		next.Previous = nil
	}
	next.Last.Phase = "success"
	next.Last.Message = "Версия проверена и установлена"
	if rollback {
		next.Last.Message = "Предыдущая версия восстановлена"
	}
	if err = service.commit(next); err != nil {
		service.restore(original, wasRunning, err)
	}
}
func (service *Service) prepare(ctx context.Context, tag string, rollback bool, state State) (Entry, error) {
	if rollback {
		entry := *state.Previous
		if entry.Digest != "" {
			if err := releases.Verify(entry.Path, entry.Digest); err != nil {
				return Entry{}, err
			}
		}
		if reported, err := service.runtime.Probe(ctx, entry.Path); err != nil {
			return Entry{}, err
		} else if reported != entry.Version {
			return Entry{}, errors.New("Сохранённый экземпляр изменился: версия для отката не совпадает")
		}
		return entry, nil
	}
	asset, err := service.source.Resolve(ctx, tag)
	if err != nil {
		return Entry{}, err
	}
	binary, err := service.source.Download(ctx, asset, service.directory)
	if err != nil {
		return Entry{}, err
	}
	service.progress("verifying", "SHA-256 проверен. Проверка версии бинарного файла")
	reported, err := service.runtime.Probe(ctx, binary)
	if err != nil {
		return Entry{}, err
	}
	if reported != tag {
		return Entry{}, fmt.Errorf("версия бинарного файла %q не совпадает с %q", reported, tag)
	}
	return Entry{Path: binary, Version: tag, Digest: asset.Digest}, nil
}
func (service *Service) finishError(original State, cause error) {
	original.Last.Phase = "failed"
	original.Last.Message = cause.Error()
	original.Pending = nil
	if err := service.commit(original); err != nil {
		service.progress("failed", cause.Error()+"; ошибка сохранения: "+err.Error())
	}
}
func (service *Service) restore(original State, wasRunning bool, cause error) {
	service.progress("rolling_back", "Новая версия не прошла проверку. Восстанавливаем предыдущий экземпляр")
	ctx, cancel := context.WithTimeout(context.Background(), OperationTimeout)
	defer cancel()
	if err := service.runtime.Activate(ctx, original.Current.Path, wasRunning); err != nil {
		service.progress("failed", fmt.Sprintf("Обновление: %v. Откат: %v. Требуется проверка журнала.", cause, err))
		return
	}
	original.Pending = nil
	original.Last.Phase = "rolled_back"
	original.Last.Message = "Предыдущий экземпляр восстановлен. Причина: " + cause.Error()
	if err := service.commit(original); err != nil {
		service.progress("failed", "Экземпляр восстановлен, но состояние не сохранено: "+err.Error())
	}
}
