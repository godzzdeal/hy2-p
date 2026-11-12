export const CERTIFICATES_HELP = {
  "Сертификат сервера": "Server certificate",
  "Путь к сертификату внутри контейнера. Для загрузки с компьютера используйте форму ниже.":
    "Certificate file path inside the container. You can upload it using the form below.",
  "Закрытый ключ сертификата": "Certificate private key",
  "Путь к ключу от этого сертификата. Ключ не нужно передавать пользователям.":
    "Private key file matching this certificate. Do not share it with users.",
  "Проверка имени сервера": "Server name validation",
  "Проверяет имя SNI клиента по сертификату сервера.":
    "Checks the client SNI against the server certificate.",
  "Сертификаты доверенных клиентов": "Trusted client certificates",
  "Нужен только для входа по клиентскому сертификату.": "Only needed for client certificate authentication.",
  "Ключ ECH": "ECH key",
  "Путь к ключу ECH. Создайте его отдельно. Для подключения нужен клиент с поддержкой ECH.":
    "ECH key file path. Create the key separately. Connections require a client with ECH support.",
  "Домены сервера": "Server domains",
  "Домены для сертификата, каждый с новой строки. Они должны указывать на этот сервер.":
    "Domains to include in the certificate, one per line. They must point to this server.",
  "Email для сертификатов": "Certificate email",
  "Email для аккаунта ACME.": "Email for the ACME account.",
  "Кто выпускает сертификат": "Certificate authority",
  "Центр сертификации для выпуска сертификата.": "Certificate authority used to issue the certificate.",
  "Хранилище сертификатов": "Certificate storage",
  "Папка сертификатов и данных продления. Оставьте пустым для постоянного хранилища панели.":
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
  "Один пароль для всех клиентов в режиме «Настройки Hysteria2». Пользователи панели в этом режиме не управляют доступом.":
    "One password for all clients in Hysteria2 settings mode. Panel user accounts do not control access in this mode.",
  "Логины и пароли": "Usernames and passwords",
  "Добавьте логины и пароли для режима «Настройки Hysteria2».":
    "Add usernames and passwords for Hysteria2 settings mode.",
  "Адрес проверки доступа": "Authentication service URL",
  "Hysteria2 будет обращаться к этому серверу, чтобы проверить данные клиента.":
    "Hysteria2 asks this service to verify client credentials.",
  "Команда проверки доступа": "Authentication command",
  "Команда на сервере для проверки данных клиента. Используется в режиме auth.type: command.":
    "Server command used to verify client credentials when auth.type is command.",
};
