export const CERTIFICATES_HELP = {
  "Сертификат сервера": "Server certificate",
  "Путь к файлу сертификата внутри контейнера. Удобнее загрузить сертификат через форму ниже.":
    "Certificate file path inside the container. You can upload it using the form below.",
  "Закрытый ключ сертификата": "Certificate private key",
  "Путь к ключу от этого сертификата. Ключ не нужно передавать пользователям.":
    "Private key file matching this certificate. Do not share it with users.",
  "Проверка имени сервера": "Server name validation",
  "Проверяет, совпадает ли имя из запроса с именем сертификата. Стандартный режим подходит большинству серверов.":
    "Checks the requested server name against the certificate. The default suits most servers.",
  "Сертификаты доверенных клиентов": "Trusted client certificates",
  "Нужно только для входа по клиентскому сертификату. Обычным ссылкам Happ это не требуется.":
    "Only needed for client certificate authentication. Regular Happ links do not require this.",
  "Ключ ECH": "ECH key",
  "Путь к ключу шифрования имени сервера. Требуется совместимый клиент и отдельная настройка.":
    "Key file for encrypted server names. Requires a compatible client and additional setup.",
  "Домены сервера": "Server domains",
  "Домены для сертификата, каждый с новой строки. Они должны указывать на этот сервер.":
    "Domains to include in the certificate, one per line. They must point to this server.",
  "Email для сертификатов": "Certificate email",
  "Адрес для уведомлений центра сертификации об ошибках и сроке действия.":
    "Address for certificate authority notifications about errors and expiry.",
  "Кто выпускает сертификат": "Certificate authority",
  "Центр сертификации, который выдаст и будет продлевать сертификат.":
    "The authority that issues and renews your certificate.",
  "Хранилище сертификатов": "Certificate storage",
  "Папка с сертификатами и данными продления. Пустое поле использует постоянное хранилище панели.":
    "Directory for certificates and renewal data. Leave empty to use the panel's persistent storage.",
  "Способ подтверждения домена": "Domain validation method",
  "HTTP требует внешний TCP 80. TLS требует TCP 443. DNS использует доступ к API вашего DNS-провайдера.":
    "HTTP requires public TCP 80. TLS requires TCP 443. DNS uses your DNS provider's API.",
  "Адрес проверки домена": "Validation listener address",
  "В Docker панель настраивает его автоматически для HTTP-проверки.":
    "The panel configures this automatically for HTTP validation in Docker.",
  "Внутренний порт HTTP-проверки": "Internal HTTP validation port",
  "Снаружи центр сертификации обращается к TCP 80. В Docker этот параметр задаёт панель.":
    "The certificate authority connects to public TCP 80. The panel manages this setting in Docker.",
  "Внутренний порт TLS-проверки": "Internal TLS validation port",
  "Внешний TCP 443 должен быть направлен на этот порт контейнера.":
    "Public TCP 443 must forward to this container port.",
  "Общий пароль подключения": "Shared connection password",
  "Один пароль для всех клиентов в нативном режиме. Индивидуальные пользователи панели в этом режиме не управляют доступом.":
    "One password for all clients in native mode. Panel user accounts do not control access in this mode.",
  "Логины и пароли": "Usernames and passwords",
  "Добавьте пары логин и пароль для нативной аутентификации Hysteria2.":
    "Add username and password pairs for native Hysteria2 authentication.",
  "Адрес проверки доступа": "Authentication service URL",
  "Hysteria2 будет обращаться к этому серверу, чтобы проверить данные клиента.":
    "Hysteria2 asks this service to verify client credentials.",
  "Команда проверки доступа": "Authentication command",
  "Программа на сервере, которая решает, разрешить ли подключение. Для обычного входа используйте пользователей панели.":
    "Server program that decides whether access is allowed. Use panel users for normal account management.",
};
