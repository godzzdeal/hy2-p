# Разработка HY2-P

## Ветки

- `main`: стабильная версия. Релизы выпускаются из этой ветки.
- `feature`: подготовка новых возможностей.
- `bugfix`: база для срочных исправлений текущего релиза. Pull Request задачи направляется сразу в `main`.

Для каждой задачи создавайте отдельную ветку:

```bash
git switch feature
git pull --ff-only
git switch -c codex/feature-panel-updates
```

Для срочного исправления:

```bash
git switch bugfix
git pull --ff-only
git switch -c codex/bugfix-watchdog
```

Не используйте имена `feature/задача` и `bugfix/задача`: Git не позволяет сочетать их с ветками `feature` и `bugfix`.

## Pull Request

Новые возможности проходят путь `ветка задачи → feature → main`. Ветка срочной задачи создаётся от `bugfix`, а её Pull Request направляется сразу в `main`.

После исправления в `main` перенесите его в `feature` через отдельный Pull Request. Перед следующей срочной задачей синхронизируйте `bugfix` с `main`.

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

GitHub Actions выполняет проверки для Pull Request и веток `main`, `feature`, `bugfix`. Готовые Docker-образы собираются для `main` или при ручном запуске сборки.
