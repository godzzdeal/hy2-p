export const DOCUMENTATION = {
  "Экземпляр для Mimic": "Instance for Mimic",
  "Отключение и удаление": "Disable and uninstall",
  "Удалить Mimic": "Uninstall Mimic",
  Проверки: "Checks",
  "Установка Mimic": "Mimic installation",
  "Проверка Mimic": "Mimic checks",
  "Готовность Mimic": "Mimic readiness",
  "Mimic готов к запуску": "Mimic is ready to start",
  "Проверьте требования Mimic": "Check the Mimic requirements",
  Готово: "Ready",
  Требуется: "Required",
  Интерфейсы: "Interfaces",
  "Нет доступных": "None available",
  "Настройки изменились. Проверьте готовность ещё раз.": "Settings changed. Check readiness again.",
  "Mimic нужен и на сервере, и на Linux-клиенте. Обычные клиенты на телефоне не подключатся. Нельзя совмещать с port hopping.":
    "Mimic is required on both the server and a Linux client. Standard phone clients cannot connect. Port hopping is not supported.",
  "Выполните на сервере. Команда установит модуль Linux, добавит TCP-порт и перезапустит панель после подтверждения.":
    "Run on your server. After confirmation, the command installs the Linux module, publishes the TCP port and restarts the panel.",
  "Режим выделяется одному экземпляру. Остальные продолжают работать с обычным UDP. В Docker используется интерфейс контейнера, обычно eth0.":
    "The mode is assigned to one instance. Other instances keep using regular UDP. In Docker, use the container interface, usually eth0.",
  "Отключить режим установки": "Disable installation mode",
  "Перед отключением выключите mimic.enabled и сохраните конфигурацию.":
    "Turn off mimic.enabled and save the configuration before disabling this mode.",
  "Mimic работает только в Linux": "Mimic only works on Linux",
  "Нужен Linux 6.1 или новее": "Linux 6.1 or later is required",
  "Модуль Linux mimic должен быть загружен": "The mimic Linux module must be loaded",
  "Программа Mimic должна быть установлена": "The Mimic program must be installed",
  "Mimic требует запуска экземпляра с правами root": "Mimic requires the instance to run as root",
  "Включите режим установки Mimic": "Enable Mimic installation mode",
  "Режим Mimic должен быть назначен этому экземпляру": "Mimic mode must be assigned to this instance",
  "Нужны NET_ADMIN, NET_RAW, BPF и PERFMON": "NET_ADMIN, NET_RAW, BPF and PERFMON are required",
  "В Docker используется /usr/local/bin/mimic": "Docker uses /usr/local/bin/mimic",
  "Нужна Hysteria2 версии 2.13.0 или новее": "Hysteria2 2.13.0 or later is required",
  Используется: "In use",
  "Сертификат удалён": "Certificate deleted",
  "Удалить сертификат?": "Delete certificate?",
  "Удалить сертификат {{name}}": "Delete certificate {{name}}",
  "Сначала остановите экземпляры, использующие этот сертификат":
    "Stop the instances using this certificate first",
  "Файл находится вне каталога данных экземпляра или использует символьную ссылку":
    "The file is outside this instance's data directory or uses a symbolic link",
  "Сертификат, его ключ и данные выдачи будут удалены. При следующем запуске ACME сможет выпустить сертификат заново.":
    "The certificate, private key and issuance metadata will be deleted. ACME can issue a new certificate when the instance starts again.",
  "Сертификат и связанный приватный ключ будут удалены. Если они указаны в настройках, загрузите замену перед запуском экземпляра.":
    "The certificate and its private key will be deleted. If they are configured, upload a replacement before starting the instance.",
  "Найти свойство": "Find property",
  "Найдено свойств: {{count}}": "Properties found: {{count}}",
  Документация: "Documentation",
  "Свойства не найдены. Попробуйте имя из документации.":
    "No properties found. Try a property name from the documentation.",
  "По умолчанию: {{value}}": "Default: {{value}}",
  "Это свойство задаёт панель при запуске экземпляра.":
    "The panel sets this property when starting the instance.",
  "Выберите «Настройки Hysteria2», чтобы редактировать auth.": "Select Hysteria2 settings to edit auth.",
  "Выберите соответствующий режим TLS / ACME.": "Select the matching TLS / ACME mode.",
  "SNI совпадает с адресом": "SNI matches server address",
  "Mimic требует отдельной установки программы и модуля Linux. Обычный контейнер панели не получает права root для экземпляра.":
    "Mimic requires its program and Linux module to be installed separately. The standard panel container does not run the instance as root.",
  "Список STUN-серверов": "STUN server list",
  "Таймаут STUN": "STUN timeout",
  "Таймаут hole punching": "Hole punching timeout",
  "Интервал heartbeat": "Heartbeat interval",
  "Отключить проверку TLS rendezvous-сервера": "Disable TLS verification for the rendezvous server",
  "Семейство IP для NAT traversal": "IP family for NAT traversal",
  "Таймаут запроса к шлюзу": "Gateway request timeout",
  "Время аренды порта": "Port lease lifetime",
  "Панель задаёт адрес статистики при запуске экземпляра.":
    "The panel sets the statistics address when starting the instance.",
  "Панель создаёт секрет статистики автоматически.":
    "The panel generates the statistics secret automatically.",
  "Удалить подключение": "Remove outbound",
  "Добавить исходящее подключение": "Add outbound",
  "Исходящие подключения используются в ACL по имени. Порядок списка сохраняется.":
    "Reference outbounds by name in ACL rules. List order is preserved.",
  "Имя исходящего подключения для правил ACL.": "Outbound name for ACL rules.",
  "Тип исходящего подключения.": "Outbound type.",
  "Порядок выбора IPv4 / IPv6.": "IPv4 / IPv6 preference.",
  "Исходящий IPv4-адрес.": "Outgoing IPv4 address.",
  "Исходящий IPv6-адрес.": "Outgoing IPv6 address.",
  "Сетевой интерфейс исходящего соединения.": "Network interface for outgoing connections.",
  "Открывать TCP-соединение после первого пакета клиента.":
    "Open the TCP connection after the first client packet.",
  "Адрес SOCKS5-прокси, например 127.0.0.1:1080.": "SOCKS5 proxy address, for example 127.0.0.1:1080.",
  "Логин SOCKS5-прокси.": "SOCKS5 proxy username.",
  "Пароль SOCKS5-прокси.": "SOCKS5 proxy password.",
  "URL HTTP-прокси, при необходимости с логином и паролем.":
    "HTTP proxy URL, including credentials if needed.",
  "Отключить проверку TLS-сертификата HTTPS-прокси.": "Disable HTTPS proxy certificate verification.",
  "outbounds должен быть списком": "outbounds must be a list",
};
