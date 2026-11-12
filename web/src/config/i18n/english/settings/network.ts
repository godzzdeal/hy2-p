export const NETWORK = {
  Предупреждение: "Warning",
  "Информация о поле {{field}}": "About {{field}}",
  "Закрыть подсказку": "Close field information",
  "Где панель принимает подключения. Для reverse proxy можно выбрать локальный адрес.":
    "Choose the network interfaces the panel listens on. A loopback address works with a reverse proxy.",
  "Порт для входа в веб-панель. После изменения сохраните настройки и перезапустите панель.":
    "The port used to access the panel. Save the settings and restart the panel after changing it.",
  "До 8 экземпляров на одном сервере.": "Up to 8 instances per server.",
  "Вычислять по сертификату": "Calculate from certificate",
  "После получения сертификата": "After the certificate is issued",
  "После замены сертификата обновите подписку на устройствах.":
    "Refresh the subscription on devices after replacing the certificate.",
  "Для pinSHA256 найдено несколько сертификатов. Укажите отпечаток вручную":
    "Multiple certificates match pinSHA256. Enter the fingerprint manually",
  "Сертификат для pinSHA256 ещё не найден. Проверьте TLS или выдачу ACME":
    "The certificate for pinSHA256 is not available yet. Check TLS or ACME issuance",
  "Не удалось прочитать сертификат для pinSHA256": "Could not read the certificate for pinSHA256",
  "Сертификат слишком большой или недоступен": "The certificate is too large or unavailable",
  "Слишком много файлов в кеше сертификатов": "Too many files in the certificate cache",
  "pinSHA256 должен содержать 64 шестнадцатеричных символа":
    "pinSHA256 must contain 64 hexadecimal characters",
  "Отпечаток сертификата: 64 hex-символа, можно с двоеточиями. После перевыпуска сертификата обновите отпечаток и подписку.":
    "Certificate fingerprint: 64 hex characters, optionally separated by colons. Refresh the fingerprint and subscription after certificate renewal.",
  "основной пароль должен отличаться от облачного": "the main password must differ from the cloud password",
  "Перетащите файл": "Drag a file",
  "или выберите": "or choose one",
  "Отпустите файл для загрузки": "Drop the file to upload",
  "Выбрать файл: {{label}}": "Choose a file: {{label}}",
  "Выберите один файл": "Choose one file",
  "Неподдерживаемый формат файла": "Unsupported file format",
  "JSON, до 16 МБ": "JSON, up to 16 MB",
  "YAML, до 1 МБ": "YAML, up to 1 MB",
  "PEM, CRT, CER или KEY, до 1 МБ": "PEM, CRT, CER or KEY, up to 1 MB",
  "PEM, CRT или CER, до 1 МБ": "PEM, CRT or CER, up to 1 MB",
  "PEM или KEY, до 1 МБ": "PEM or KEY, up to 1 MB",
  "Скопируйте значение вручную": "Select the value and copy it manually",
  "Страницы списка": "List pages",
  "Заполните поле «{{field}}».": "Fill in the {{field}} field.",
  "Поле «{{field}}»: не менее {{count}} символов.": "{{field}}: at least {{count}} characters.",
  "Поле «{{field}}»: не более {{count}} символов.": "{{field}}: no more than {{count}} characters.",
  "Проверьте заполнение полей": "Check the form fields",
  "Не менее {{count}} символов": "At least {{count}} characters",
  "Не более {{count}} символов": "No more than {{count}} characters",
  "Проверить firewall": "Check firewall",
  "Действие при импорте": "Import action",
  "Без изменений": "Unchanged",
  Автоматически: "Automatic",
  Управление: "Control",
  "Использовать адрес панели": "Use the panel address",
  Выключен: "Off",
  "Показать пароль": "Show password",
  "Скрыть пароль": "Hide password",
  "для HTTPS укажите домен или IP без схемы и порта":
    "for HTTPS, enter a domain or IP without a scheme or port",
  "для сертификата ACME на IP укажите публичный IPv4 или IPv6":
    "ACME IP certificates require a public IPv4 or IPv6 address",
  "выберите корректный флаг пользователей": "choose a valid default user flag",
  "Управление HY2": "HY2 control",
  "Обновление экземпляра": "Instance update",
  "Версия HY2": "HY2 version",
  "Проверить версии HY2": "Check HY2 versions",
  "Не удалось загрузить версии. Повторите проверку.": "Could not load versions. Check again.",
  "Файл проверяется по SHA-256. Предыдущая версия сохраняется для отката.":
    "Files are verified with SHA-256. The previous version is kept for rollback.",
  "Общий флаг пользователей": "Default user flag",
  "Общий флаг": "Default flag",
  "Общий флаг для пользователей без своего флага. Имена не меняются. После изменения обновите подписку в приложении.":
    "Used in the panel and subscriptions when a user has no individual flag. User names are kept unchanged. Refresh the subscription after changing it.",
  "HTTP без сертификата": "HTTP without a certificate",
  "Домен или IP веб-панели": "Panel domain or IP address",
  "Домен и сертификат не нужны. Адрес формируется автоматически. HTTP не шифрует соединение.":
    "No domain or certificate is required. The address is generated automatically. HTTP traffic is not encrypted.",
  "Входящий TCP 80 должен вести на этот порт. Для домена проверьте DNS, для IP укажите публичный адрес сервера.":
    "Inbound TCP port 80 must reach this port. Check DNS for a domain, or enter the server's public IP address.",
  "Для публичного IP используется сертификат Let's Encrypt на 160 часов. Панель автоматически продлевает его; TCP 80 должен оставаться доступным.":
    "Public IPs use a 160-hour Let's Encrypt certificate. The panel renews it automatically; TCP port 80 must remain reachable.",
};
