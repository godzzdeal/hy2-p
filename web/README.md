# HY2-P Web

Next.js 16.4.6 с App Router, React, TypeScript, Tailwind CSS и SCSS. Для зависимостей и запуска используется Bun. Команды выполняются из каталога `web`.

## Разработка

```bash
bun install --frozen-lockfile
bun run dev
```

Интерфейс открывается по адресу `http://127.0.0.1:3000`. Go API должен работать отдельно на `http://127.0.0.1:18080`. Другой адрес задаётся через `HY2_API_URL` в `.env.local`. Пароль не хранится во фронтенде: он задан в запускаемой Go-панели.

## Сборка

```bash
bun run build
bun run start
```

`build` собирает production-версию, `start` запускает уже собранную панель. Сборка Docker выполняет эти шаги внутри Linux.

## Проверки

```bash
bun run lint
bun run test
bun run test:ui
```

`lint` проверяет форматирование и TypeScript. `test` запускает модульные проверки, `test:ui` проверяет интерфейс в браузере на ПК и телефоне. Для браузерных тестов нужна production-сборка или уже запущенный локальный сервер.

## Структура

Маршруты и компоненты страниц находятся в `src/app`. Имена `page.tsx`, `layout.tsx`, `error.tsx` и `loading.tsx` заданы Next.js. Обычные компоненты используют PascalCase.

Повторно используемые элементы находятся в `src/components`, обращения к API в `src/services`, логика запросов и действий в `src/hooks`. Адрес страницы определяет открытый раздел. Данные сервера хранятся в TanStack Query, состояние интерфейса в Zustand.

[Разработка проекта](../CONTRIBUTING.md) | [Установка на сервер](../docs/install.md)
