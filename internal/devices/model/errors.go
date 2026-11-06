package model

import "errors"

var ErrMissingHWID = errors.New("Для этой подписки включите передачу ID устройства в Happ и обновите подписку")
var ErrLimitReached = errors.New("Достигнут лимит устройств. Попросите администратора освободить место")
var ErrBlocked = errors.New("Доступ этого устройства отключён администратором")
var ErrUnavailable = errors.New("Не удалось сохранить устройство. Повторите обновление подписки")
var ErrRegistryFull = errors.New("Список устройств заполнен. Удалите старые записи в панели")
