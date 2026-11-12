export const TOOLS: Record<string, string> = {
  "Защищённые TCP-порты:": "Protected TCP ports:",
  "Не удалось прочитать защищённые порты firewall": "Could not read protected firewall ports",
  "Не удалось проверить публикацию Docker. Закрытие порта отменено":
    "Could not check Docker port mappings. Blocking the port was cancelled",
  "Группа дополнительно ограничивает доступные экземпляры:": "The group also restricts allowed instances:",
  Группы: "Groups",
  Группа: "Group",
  "Группы пользователей": "User groups",
  "Группа пользователя": "User group",
  "Группы сохранены": "Groups saved",
  "Создать группу": "Create group",
  "Новая группа": "New group",
  "Редактировать группу": "Edit group",
  "Название группы": "Group name",
  "Цвет группы": "Group color",
  "Сохранить группу": "Save group",
  "Удалить группу {{name}}": "Delete group {{name}}",
  "Удалить группу? Пользователи сохранятся, ограничения группы перестанут действовать.":
    "Delete this group? Users will remain and group restrictions will be removed.",
  "Доступные экземпляры группы": "Group instances",
  "Лимит трафика на участника, ГБ": "Traffic limit per member, GB",
  "Лимит устройств на участника": "Device limit per member",
  "0 снимает лимит группы. При личном и групповом лимите действует меньший. Доступны только экземпляры, разрешённые и группе, и пользователю. Трафик сохраняется.":
    "0 removes the group limit. The lower personal or group limit applies. Only instances allowed for both the group and the user are available. Traffic counters are kept.",
  "Объединяйте пользователей в группы с общими лимитами и доступом к экземплярам. Пользователь может входить в одну группу.":
    "Group users with shared limits and instance access. Each user can belong to one group.",
  "Групп пока нет. Создайте первую и добавьте в неё пользователей.":
    "No groups yet. Create one and assign users to it.",
  "Фильтр по группе": "Filter by group",
  "Все группы": "All groups",
  "Без группы": "No group",
  "Изменить группу пользователя {{id}}": "Change group for user {{id}}",
  "Ограничения группы действуют вместе с личными. Смена группы перезапустит подключение. Если включён лимит устройств, обновите подписку в приложении.":
    "Group limits supplement personal limits. Changing groups restarts the connection; refresh the subscription if a device limit is enabled.",
  "Лимит группы:": "Group limit:",
  "Личный лимит может быть только строже.": "The personal limit can only be stricter.",
  "Действующий лимит с учётом группы:": "Effective limit including the group:",
  Бирюзовый: "Cyan",
  Синий: "Blue",
  Зелёный: "Green",
  Янтарный: "Amber",
  Фиолетовый: "Purple",
  Серый: "Gray",
  "Укажите имя и цвет группы": "Enter the group name and color",
  "Некорректные лимиты группы": "Invalid group limits",
  "Группа не найдена": "Group not found",
  "Группа с таким именем уже существует": "A group with this name already exists",
  "Достигнут предел: 64 группы": "The limit of 64 groups has been reached",
  "Выберите экземпляры с пользователями панели": "Select instances using panel users",
  "Сначала отключите лишние устройства участников группы": "Disable excess devices for group members first",
  "Сначала отключите лишние устройства пользователя": "Disable this user's excess devices first",
  "Развернуть меню": "Expand menu",
  "Свернуть меню": "Collapse menu",
  "Какие порты открыть": "Which ports to open",
  "Откройте TCP-порт панели и UDP-порты экземпляров. Для HTTP-проверки ACME нужен TCP 80, для TLS-проверки TCP 443. DNS-проверке входящий порт не нужен.":
    "Usually allow the panel TCP port, instance UDP ports, and TCP 80 for HTTP ACME or 443 for TLS ACME. DNS ACME needs no inbound port.",
  "Порты из настроек и публикации Docker. Доступность из интернета не проверена.":
    "Ports from settings and Docker mappings. Internet reachability has not been checked.",
  "Порт ещё не применён. Сохраните настройки и примените публикацию Docker.":
    "Apply this change or publish the Docker port first.",
  "Скопировать команду для {{port}}": "Copy command for {{port}}",
  "Вход в панель": "Panel access",
  "Подключение Hysteria2": "Hysteria2 connection",
  "Проверка сертификата ACME по HTTP": "ACME HTTP certificate validation",
  "Проверка сертификата ACME по TLS": "ACME TLS certificate validation",
  "HTTP-сайт маскировки": "HTTP masquerade site",
  "HTTPS-сайт маскировки": "HTTPS masquerade site",
  "Не удалось прочитать настройки экземпляров:": "Could not read instance settings:",
  "Откройте нужные публичные порты и в firewall хостинга. SSH-порт оставьте открытым. Traffic Stats и внутренние порты панели не открывайте в интернет.":
    "Keep Traffic Stats and internal panel ports private. Keep your SSH port allowed. Also allow public ports in the hosting firewall.",
  "Как вернуть доступ или отменить правило": "Restore access or undo a rule",
  "Закрыли нужный порт? Откройте его в панели или выполните команду выше через SSH. Для отмены правила найдите его номер и удалите эту строку:":
    "If you blocked a required port, select Allow port or run its command above over SSH. To remove an added rule, find its number and delete only that entry:",
  НОМЕР_ПРАВИЛА: "RULE_NUMBER",
  "Удаление правила не возвращает прежние правила. Не используйте ufw reset: он удалит их все. Публикация Docker и firewall хостинга настраиваются отдельно.":
    "Deleting a rule does not restore earlier rules. Do not use ufw reset to undo changes. UFW does not replace Docker mappings or the hosting firewall.",
  Б: "B",
  КБ: "KB",
  МБ: "MB",
  ГБ: "GB",
  ТБ: "TB",
  "Фактический секрет Traffic Stats": "Actual Traffic Stats secret",
  "ACME продлевает TLS-сертификат. Ключ ECH создаётся отдельно. Клиентам передаётся только публичная часть tls.ech.":
    "ACME renews the TLS certificate. ECH uses separate keys; clients receive only the public tls.ech config.",
  "Внешнее имя SNI для ECH": "ECH public SNI name",
  "Создать ключ ECH": "Generate ECH key",
  "Создаём ECH…": "Generating ECH…",
  "Получить публичный ECH": "Read public ECH config",
  "ECH ещё не настроен в сохранённой конфигурации.": "ECH is not configured in the saved configuration yet.",
  "Скопировать tls.ech": "Copy tls.ech",
  "Публичный ECH добавляется в ссылку подключения. После замены ключа обновите подписку. Клиент должен поддерживать ECH для Hysteria2.":
    "Public ECH is included in the connection link. Refresh the subscription after replacing the key. The client must support ECH for Hysteria2.",
  "Ключ ECH создан. Сохраните конфигурацию и перезапустите экземпляр.":
    "ECH key generated. Save the configuration and restart the instance.",
  "Панель задаёт trafficStats.listen и trafficStats.secret при запуске экземпляра. Ниже можно посмотреть текущие значения.":
    "The panel sets trafficStats.listen and trafficStats.secret when the instance starts. View the current values below.",
  "Скрыть секрет": "Hide secret",
  "Показать секрет Traffic Stats": "Show Traffic Stats secret",
  "Адрес статистики": "Statistics address",
  "Экземпляр запущен": "Instance is running",
  "Экземпляр остановлен. Значения применятся при запуске.":
    "The instance is stopped. These values will apply at startup.",
  "Скопировать секрет": "Copy secret",
  "Секрет может измениться после перезапуска панели. API статистики доступен только внутри сервера.":
    "The secret may change when the panel restarts. The statistics API is only accessible inside the server.",
  "Firewall сервера": "Server firewall",
  "Проверить UFW": "Check UFW",
  "Правила UFW для входящих TCP/UDP-портов Ubuntu. Порты SSH и панели защищены от закрытия.":
    "UFW rules for inbound Ubuntu TCP/UDP ports. SSH and panel ports are protected.",
  "Опубликованные Docker-порты могут обходить UFW. Удаление правила не гарантирует, что порт закроется. Проверьте firewall хостинга.":
    "Docker ports can bypass UFW. Removing a rule does not guarantee that a port is closed. Check the hosting firewall too.",
  "Для подключения помощника выполните на сервере: sudo hy2-panel firewall-setup":
    "To install the helper, run on your server: sudo hy2-panel firewall-setup",
  "UFW включён": "UFW is active",
  "UFW выключен. Изменение правил недоступно.": "UFW is inactive. Rule changes are unavailable.",
  Порт: "Port",
  Протокол: "Protocol",
  Действие: "Action",
  "Открыть порт": "Allow port",
  "Закрыть порт": "Block port",
  "Применить правило": "Apply rule",
  "Применяем…": "Applying…",
  "Закрыть порт? Существующие подключения могут прерваться.":
    "Block this port? Existing connections may be interrupted.",
  "Не удалось прочитать файл ECH": "Could not read the ECH file",
  "Файл ECH слишком большой или недоступен": "The ECH file is too large or unavailable",
  "Повреждён публичный список ECH": "Invalid public ECH config list",
  "В файле нет публичного блока ECH CONFIGS. ACME-сертификат не содержит ключей ECH":
    "The file has no public ECH CONFIGS block. ACME certificates do not contain ECH keys",
  "Укажите доменное имя для внешнего SNI ECH": "Enter a domain name for the ECH public SNI",
  "Не удалось создать ECH. Требуется экземпляр HY2 с командой ech (2.12.3 или новее)":
    "Could not generate ECH. Hysteria2 with the ech command (2.12.3 or newer) is required",
  "Помощник firewall недоступен. На сервере выполните sudo hy2-panel firewall-setup":
    "Firewall helper unavailable. Run sudo hy2-panel firewall-setup on your server",
  "Изменение защищённого порта SSH или панели запрещено": "SSH and panel port rules are protected",
  "Порт опубликован Docker. UFW его не блокирует; измените публикацию контейнера.":
    "Docker publishes this port. UFW does not block it; change the container port publishing.",
  "UFW выключен. Сначала настройте и включите firewall на сервере.":
    "UFW is inactive. Configure and enable the server firewall first.",
  "Команда firewall не выполнена. Проверьте журнал службы.":
    "Firewall command failed. Check the service log.",
  "Слишком много правил для одного порта. Проверьте их на сервере.":
    "Too many rules for one port. Review them on the server.",
  "Помощник firewall не смог выполнить операцию": "The firewall helper could not complete the operation",
};
