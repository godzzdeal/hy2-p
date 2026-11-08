export const TOOLS: Record<string, string> = {
  "Фактический секрет Traffic Stats": "Actual Traffic Stats secret",
  "ACME обновляет TLS-сертификат. ECH создаётся отдельно; клиентам передаётся только публичный tls.ech.":
    "ACME renews the TLS certificate. ECH uses separate keys; clients receive only the public tls.ech config.",
  "Внешнее имя SNI для ECH": "ECH public SNI name",
  "Создать ключ ECH": "Generate ECH key",
  "Создаём ECH…": "Generating ECH…",
  "Получить публичный ECH": "Read public ECH config",
  "ECH ещё не настроен в сохранённой конфигурации.": "ECH is not configured in the saved configuration yet.",
  "Скопировать tls.ech": "Copy tls.ech",
  "При замене ключа ECH обновите tls.ech на клиентах. Экспорт ECH в ссылки Happ пока не поддерживается.":
    "When replacing ECH keys, update tls.ech on clients. Happ URI export does not support ECH yet.",
  "Ключ ECH создан. Сохраните конфигурацию и перезапустите ядро.":
    "ECH key generated. Save the configuration and restart the engine.",
  "Панель задаёт trafficStats.listen и trafficStats.secret при запуске ядра. Ниже можно получить фактические значения панели.":
    "The panel sets trafficStats.listen and trafficStats.secret when the engine starts. Retrieve the actual panel values below.",
  "Скрыть секрет": "Hide secret",
  "Показать секрет Traffic Stats": "Show Traffic Stats secret",
  "Адрес статистики": "Statistics address",
  "Ядро запущено": "Engine is running",
  "Ядро остановлено. Значения применятся при запуске.":
    "The engine is stopped. These values will apply at startup.",
  "Скопировать секрет": "Copy secret",
  "Секрет может измениться после перезапуска панели. API статистики слушает loopback и не публикуется в интернет.":
    "The secret may change after restarting the panel. The statistics API uses loopback and is not exposed to the internet.",
  "Firewall сервера": "Server firewall",
  "Проверить UFW": "Check UFW",
  "Правила UFW для входящих TCP/UDP-портов Ubuntu. Порты SSH и панели защищены от закрытия.":
    "UFW rules for inbound Ubuntu TCP/UDP ports. SSH and panel ports are protected.",
  "Опубликованные порты Docker могут обходить UFW. Панель не выдаёт такие порты за закрытые. Firewall хостинга настраивается отдельно.":
    "Published Docker ports may bypass UFW. The panel does not report them as blocked. Configure the hosting firewall separately.",
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
  "Не удалось создать ECH. Требуется ядро Hysteria2 с командой ech (2.12.3 или новее)":
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
