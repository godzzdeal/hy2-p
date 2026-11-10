# Разработка HY2-P

## Ветки

- `main`: стабильная версия. Релизы выпускаются из этой ветки.
- `feature/<задача>`: новые возможности.
- `bugfix/<задача>`: исправления ошибок.

Для каждой задачи создавайте отдельную ветку:

```bash
git switch main
git pull --ff-only
git switch -c feature/panel-updates
```

Для срочного исправления:

```bash
git switch main
git pull --ff-only
git switch -c bugfix/watchdog
```

`feature/` и `bugfix/` обозначают группы веток. Отдельные ветки с именами `feature` и `bugfix` не создаются.

## Pull Request

Ветки задач создаются от актуальной `main`. Pull Request из `feature/<задача>` или `bugfix/<задача>` направляется в `main`. Срочные исправления попадают в `main` без промежуточной ветки.

В описании укажите, что изменилось для пользователя и как это проверено. Для изменений интерфейса приложите снимки на компьютере и телефоне. Дождитесь успешных проверок перед слиянием.

## Локальные проверки

Из корня проекта:

```bash
go test -race ./...
bash scripts/check-go.sh
```

Для интерфейса:

```bash
cd web
bun install --frozen-lockfile
bun run test
bun run lint
bun run build
bun run test:ui
```

GitHub Actions выполняет проверки для Pull Request и веток `main`, `feature/**`, `bugfix/**`. Готовые Docker-образы собираются для `main` или при ручном запуске сборки.
