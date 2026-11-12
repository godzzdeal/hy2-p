<div align="center">
  <img src="web/assets/pwa/icons/icon-192.png" width="80" height="80" alt="">
  <h1>HY2-P</h1>
  <p>Веб-панель для Hysteria2: пользователи, конфигурации и обслуживание сервера.</p>
  <p><a href="https://hy2-p.vercel.app"><img src="https://img.shields.io/badge/Открыть_демо-096d79?style=for-the-badge&amp;logo=vercel&amp;logoColor=white" alt="Открыть демоверсию"></a> <a href="docs/install.md"><img src="https://img.shields.io/badge/Установка-071320?style=for-the-badge&amp;logo=docker&amp;logoColor=white" alt="Установка"></a></p>
  <p><a href="https://github.com/godzzdeal/hy2-p/releases/latest"><img src="https://img.shields.io/github/v/release/godzzdeal/hy2-p?style=flat-square&amp;label=release&amp;color=096d79" alt="Последний релиз"></a> <a href="https://github.com/godzzdeal/hy2-p/actions/workflows/ci.yml"><img src="https://github.com/godzzdeal/hy2-p/actions/workflows/ci.yml/badge.svg" alt="Проверки"></a> <a href="https://github.com/godzzdeal/hy2-p/stargazers"><img src="https://img.shields.io/github/stars/godzzdeal/hy2-p?style=flat-square&amp;color=096d79" alt="GitHub Stars"></a></p>
  <p><a href="docs/install.md">Установка</a> | <a href="docs/management.md">Команды</a> | <a href="docs/panel/index.md">Работа в панели</a> | <a href="docs/install.md#бесплатный-домен-freedns">FreeDNS</a> | <a href="https://github.com/godzzdeal/hy2-p/releases">Релизы</a> | <a href="ROADMAP.md">Roadmap</a></p>
</div>

Панель для Ubuntu с установкой в Docker. Работает на AMD64 и ARM64, не требует сборки на сервере. Русский и английский интерфейс, светлая и тёмная темы.

<p align="center"><a href="https://hy2-p.vercel.app"><img src="docs/images/overview.png" width="100%" alt="HY2-P: обзор сервера. Открыть демо"></a></p>

Демо доступно без установки. Данные учебные; после выхода используйте логин и пароль `demo` / `demo`.

## Возможности

- Пользователи и группы, срок действия и лимиты трафика.
- Подписки, ссылки `hy2://` и QR-коды. Выбор доступных экземпляров для каждого пользователя.
- Учёт устройств через Happ: модель, ОС, IP, лимит и состояние подключения.
- До 8 экземпляров HY2 со своими настройками, портами и версиями.
- Свойства Hysteria2, редактор YAML, TLS/ACME, ECH и Traffic Stats.
- Графики нагрузки и сети, учёт трафика, журнал с поиском и фильтром по пользователю.
- Обновление панели и HY2 из браузера, резервные копии, откат и watchdog.
- Импорт и экспорт конфигураций, пользователей и групп.
- Управление UFW через помощника, дополнительный облачный пароль и установка панели как PWA.

<details>
<summary><strong>Посмотреть интерфейс</strong></summary>

<p><a href="docs/images/users.png"><img src="docs/images/users.png" width="49%" alt="Пользователи и группы"></a> <a href="docs/images/configuration.png"><img src="docs/images/configuration.png" width="49%" alt="Настройки Hysteria2"></a></p>

</details>

## Установка

Нужны Ubuntu 22.04, 24.04, 26.04 или 26.10, публичный IP и доступ по SSH с правами sudo.

Подключитесь к серверу по SSH. Если вошли не под `root`, выполните:

```bash
sudo -i
```

Запустите установщик и выберите настройки:

```bash
bash <(curl -fsSL https://hy2-p.vercel.app/install.sh)
```

Или сразу передайте параметры для HTTPS, заменив домен и email:

```bash
bash <(curl -fsSL https://hy2-p.vercel.app/install.sh) \
  --yes --domain vpn.example.com --email admin@example.com \
  --accept-acme-terms --open-ports
```

Домен должен указывать на IP сервера. [Как получить бесплатный домен](docs/install.md#бесплатный-домен-freedns).

Установщик установит Docker при необходимости и покажет адрес панели, логин `admin` и случайный пароль. Сохраните их. `--open-ports` добавляет правила UFW для панели, HY2 и ACME, но не включает UFW. В firewall хостинга разрешите TCP `9443`, TCP `80` и UDP `8443`.

[Параметры установщика](docs/installation/parameters.md) | [Ошибки установки](docs/installation/troubleshooting.md) | [Ручной запуск в Docker](docs/docker.md)

## Первое подключение

1. Откройте **Конфигурацию** выбранного экземпляра. Задайте адрес и UDP-порт.
2. Включите **SNI совпадает с адресом**, если используете тот же домен для сертификата.
3. В **TLS / ACME** укажите сертификат с ключом или настройте ACME.
4. В **Authentication** оставьте **Пользователи панели**, сохраните настройки и запустите экземпляр.
5. Если меняли порт, нажмите **Применить UDP-порт** и дождитесь проверки.
6. Добавьте пользователя. В его меню откройте **Подключение** и импортируйте подписку в приложение.

Сертификаты панели и HY2 настраиваются отдельно. Для HTTP-проверки ACME нужен TCP-порт `80`, доступный извне. [Пользователи и группы](docs/panel/users.md) | [Экземпляры и ACL](docs/panel/instances.md).

Используйте приложение с поддержкой Hysteria2. Доступные экземпляры появятся в одной подписке. После смены адреса, порта или пароля обновите её. Лимит устройств требует передачи ID устройства приложением; этот режим проверен с Happ.

## Пример конфигурации

Использую этот конфиг у себя. Он не универсальный: в другой сети или у другого оператора могут понадобиться изменения.

<details>
<summary><strong>Конфигурация сервера</strong></summary>

```yaml
listen: :8443

acme:
  domains:
    - vpn.example.com
  email: admin@example.com
  ca: letsencrypt
  dir: /data/acme-hy2
ech:
  keyPath: /data/ech/REPLACE_WITH_KEY_DIRECTORY/ech.pem

obfs:
  type: salamander
  salamander:
    password: REPLACE_WITH_YOUR_RANDOM_OBFS_PASSWORD

quic:
  maxIdleTimeout: 30s
  disablePathMTUDiscovery: false

ignoreClientBandwidth: true
congestion:
  type: bbr
  bbrProfile: standard
speedTest: true

disableUDP: false
udpIdleTimeout: 60s

masquerade:
  type: proxy
  proxy:
    url: https://reuters.com
    rewriteHost: true
```

</details>

Замените домен и email, сгенерируйте пароль и укажите путь к созданному ключу ECH. [Как повторить настройку](docs/configuration.md).

**ECH скрывает имя сервера в TLS и помогает минимизировать риск блокировок по SNI.** Это не 100% гарантия доступности: IP сервера остаётся видимым и может быть заблокирован отдельно.

## Обновление и откат

В **Настройки → Обслуживание** выберите версию и нажмите **Обновить**. Здесь же доступны перезапуск и откат. Для обновления из браузера панель должна быть установлена установщиком HY2-P. [Выбор версии и восстановление](docs/operations/updates.md).

```bash
sudo hy2-panel update
```

Перед обновлением создаётся резервная копия. Предыдущий образ хранится в сжатом архиве, старые образы и завершённые контейнеры HY2-P удаляются. При неудачном запуске выполняется автоматический откат. Вручную:

```bash
sudo hy2-panel rollback
```

Откат возвращает данные из копии перед обновлением. HY2 обновляется отдельно в **Управление HY2**.

В **Настройки → Firewall** можно управлять правилами UFW. [Подключение помощника](docs/management/firewall.md). Он не включает UFW автоматически; SSH-порты и порт панели защищены от изменения. Опубликованные порты Docker могут обходить UFW, firewall хостинга настраивается у провайдера.

## Помощь

**[Установка и FreeDNS](docs/install.md) | [Команды и восстановление](docs/management.md) | [Документация Hysteria2](https://v2.hysteria.network/docs/getting-started/Installation/) | [Сообщить об ошибке](https://github.com/godzzdeal/hy2-p/issues)**

При сообщении об ошибке приложите версию панели и журнал без паролей, ключей и ссылок подписки.
