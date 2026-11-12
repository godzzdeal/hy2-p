export const NETWORK_HELP = {
  "DNS на сервере": "Server DNS",
  "Как сервер получает IP-адреса сайтов. Оставьте пустым для системного DNS.":
    "How the server resolves website addresses. Leave empty to use its system DNS.",
  "Определять домены из трафика": "Detect domains in traffic",
  "Помогает применять правила к доменам, когда клиент передал только IP-адрес.":
    "Helps apply domain rules when the client provides only an IP address.",
  "Время определения домена": "Domain detection timeout",
  "Сколько ждать данные для определения домена, например 2s.":
    "How long to wait for domain detection, for example 2s.",
  "Использовать определённый домен": "Use the detected domain",
  "Заменяет IP назначения найденным доменом перед отправкой запроса.":
    "Replaces the destination IP with the detected domain before forwarding.",
  "Какие TCP-порты проверять": "TCP ports to inspect",
  "Порты для определения домена, например 80,443.": "Ports used for domain detection, for example 80,443.",
  "Какие UDP-порты проверять": "UDP ports to inspect",
  "UDP-порты для определения домена, например 443.": "UDP ports used for domain detection, for example 443.",
  "Файл правил": "Routing rules file",
  "Куда отправлять трафик и какие запросы блокировать.": "Where to send traffic and which requests to block.",
  "Правила в панели": "Rules in the panel",
  "Каждое правило с новой строки. Проверяются сверху вниз.":
    "One rule per line. Order matters: rules are checked from top to bottom.",
  "База IP-адресов стран": "Country IP database",
  "Путь к базе GeoIP для правил по странам.": "GeoIP database path for country-based rules.",
  "База групп сайтов": "Website groups database",
  "Путь к базе GeoSite для правил по категориям сайтов.": "GeoSite database path for website category rules.",
  "Обновление баз маршрутизации": "Routing database updates",
  "Как часто загружать свежие GeoIP и GeoSite, например 168h.":
    "How often to update GeoIP and GeoSite, for example 168h.",
  "Как выходить в интернет": "Internet exit routes",
  "Куда сервер отправляет трафик: напрямую или через другой прокси. Настройка в JSON.":
    "Server outbound connections: direct or through another proxy. Configured as JSON.",
  "Ответ посторонним запросам": "Response to other requests",
  "Что покажет сервер, если запрос пришёл не от клиента Hysteria2.":
    "What the server returns when a request is not from a Hysteria2 client.",
  "Папка с сайтом": "Website directory",
  "Файлы сайта, который будет показываться посторонним запросам.":
    "Website files to return to other requests.",
  "Сайт для маскировки": "Masquerade website",
  "Сервер будет получать содержимое с этого сайта и возвращать его посетителю.":
    "The server fetches content from this website and returns it to the visitor.",
  "Текст ответа": "Response text",
  "Текст или HTML для посторонних запросов.": "Text or HTML returned to other requests.",
  "Код ответа сайта": "Website response code",
  "Например 200 для обычной страницы или 404 для отсутствующей.":
    "For example 200 for a normal page or 404 for a missing page.",
  "Отправлять посетителей на HTTPS": "Redirect visitors to HTTPS",
  "Перенаправляет обычные HTTP-запросы сайта маскировки на HTTPS.":
    "Redirects HTTP requests for the masquerade site to HTTPS.",
  "Имитация TCP для Linux": "TCP imitation for Linux",
  "Режим Hysteria2, для которого нужно отдельно подготовить сеть сервера. Оставьте выключенным, если не настраивали его.":
    "Additional Hysteria2 mode requiring server network setup. Leave disabled unless configured.",
  "Дополнительные серверы Realm": "Realm servers",
  "Соединение с другими серверами Hysteria2. Для этого режима панель не создаёт ссылки подключения.":
    "Advanced Hysteria2 server chaining. Connection link export is unavailable for this mode.",
};
