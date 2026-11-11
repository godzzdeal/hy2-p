# HY2-P Web

Next.js 16.4.6, App Router, React, TypeScript, Tailwind CSS и SCSS. Зависимости и команды запускаются через Bun.

```bash
bun install --frozen-lockfile
bun run dev
```

Интерфейс: http://127.0.0.1:3000. Go API по умолчанию ожидается на http://127.0.0.1:18080. Другой адрес задаётся в `HY2_API_URL` в `.env.local`.

```bash
bun run build
bun run start
```

Маршруты находятся в `src/app`, представления в `src/views`. Общие элементы находятся в `src/components`, работа с API в `src/services` и `src/hooks`. Состояние раздела определяется адресом страницы.

```bash
bun run lint
bun run test
bun run test:ui
```
