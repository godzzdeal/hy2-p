# Ручное развёртывание Docker Compose

Этот вариант не использует менеджер hy2-panel. Нужны Docker Engine и Compose v2.

1. Склонируйте репозиторий и перейдите в его папку.
2. Создайте .env из .env.example, замените пароль администратора.
3. Создайте папку certs.
4. Запустите docker compose up -d --build.

По умолчанию HTTP-порт 8080 публикуется только на 127.0.0.1.
Для доступа используйте ssh -N -L 18080:127.0.0.1:8080 USER@SERVER_IP и http://127.0.0.1:18080.
Порт Hysteria2 — 8443/UDP; он опубликован на всех интерфейсах.

## Первоначальный HTTPS через окружение

До сохранения настроек в интерфейсе можно задать:

PANEL_TLS_MODE=acme
PANEL_DOMAIN=panel.example.com
PANEL_ACME_EMAIL=admin@example.com
PANEL_ACME_ACCEPT_TERMS=true
PANEL_PORT=9443
PANEL_BIND=0.0.0.0
PANEL_PUBLIC_URL=https://panel.example.com:9443
PANEL_ACME_PORT=9080

PANEL_ACME_ACCEPT_TERMS=true означает принятие условий Let's Encrypt.
Для HTTP-01 используйте docker compose -f compose.yaml -f compose.acme.yaml up -d --build.
Внешний TCP 80 должен попадать на challenge порт (по умолчанию 9080).
Если TCP 80 уже занят reverse proxy, используйте его для HTTPS панели либо настройте маршрутизацию challenge.

## Изменение настроек

Сохранённые параметры веб-панели имеют приоритет над начальными переменными окружения.
После изменения порта в интерфейсе измените PANEL_PORT в .env и пересоздайте контейнер.
При изменении challenge порта поменяйте PANEL_ACME_PORT.
Встроенный HTTPS самостоятельно включает Secure для cookie. Для HTTPS reverse proxy задайте PANEL_SECURE_COOKIE=true.

## Данные

Compose хранит данные в именованном томе panel-data с префиксом имени проекта.
Для полного резервного копирования остановите панель, сохраните весь том, .env и certs.
Не удаляйте том при пересоздании контейнера. При переносе нужен ключ secrets/users.key.
Контейнер работает с UID 10001 и без Docker socket.

Работавшее ядро восстанавливается после перезапуска панели. Ручная остановка сохраняется.
Для ACME ядра удобен DNS challenge; он не занимает TCP-порты веб-панели.
