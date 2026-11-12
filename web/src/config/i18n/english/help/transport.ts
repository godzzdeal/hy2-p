export const TRANSPORT_HELP = {
  "Порт Hysteria2": "Hysteria2 port",
  "Например :61254. UDP-порт экземпляра внутри контейнера. Порт веб-панели задаётся отдельно.":
    "For example :61254. This is the VPN port inside the container. The web panel port is configured separately.",
  "Скорость скачивания у клиента": "Client download speed",
  "Скорость от сервера к клиенту в режиме Brutal, например 100 mbps. Пустое поле снимает лимит.":
    "Server-to-client speed in Brutal mode, for example 100 mbps. Leave empty for no limit.",
  "Скорость отправки у клиента": "Client upload speed",
  "Скорость от клиента к серверу в режиме Brutal, например 50 mbps. На BBR и Reno не влияет.":
    "Client-to-server limit in Brutal mode, for example 50 mbps. Has no effect on BBR or Reno.",
  "Отключить компенсацию потерь": "Disable loss compensation",
  "В режиме Brutal сервер может отправлять чуть больше данных при потерях. Включите, чтобы строго соблюдать заданную скорость.":
    "In Brutal mode, the server may send extra data to compensate for losses. Enable this to keep the configured rate.",
  "Игнорировать скорость клиента": "Ignore client bandwidth",
  "Использовать BBR или Reno, даже если клиент запросил Brutal.":
    "Use BBR or Reno even when the client requests Brutal.",
  "Контроль перегрузки": "Congestion control",
  "BBR подбирает скорость под качество сети. Reno обычно осторожнее. Если не уверены, оставьте BBR.":
    "BBR adapts to network conditions. Reno is generally more conservative. Leave BBR selected if unsure.",
  "Профиль BBR": "BBR profile",
  "Профиль BBR: standard, conservative или aggressive. Действует при congestion.type: bbr.":
    "BBR profile: standard, conservative or aggressive. Only applies when congestion.type is bbr.",
  "Тест скорости": "Speed test",
  "Разрешить встроенную проверку скорости Hysteria2. Это не проверка доступности сайтов.":
    "Allow the built-in Hysteria2 speed test. This does not check whether websites are reachable.",
  "Запретить UDP-запросы клиентов": "Block client UDP requests",
  "Запрещает передачу UDP через VPN, в том числе для игр и звонков. Соединение Hysteria2 по-прежнему использует UDP.":
    "Blocks UDP traffic inside the VPN, such as games and calls. Hysteria2 itself still uses UDP.",
  "Таймаут UDP": "UDP idle timeout",
  "Через сколько закрывать неактивный UDP-поток, например 60s.":
    "How long an idle UDP stream stays open, for example 60s.",
  "Начальный буфер потока": "Initial stream buffer",
  "Начальный объём буфера для одного потока. Обычно менять не нужно.":
    "Initial receive buffer for one stream. Usually no change is needed.",
  "Максимальный буфер потока": "Maximum stream buffer",
  "Максимальный буфер потока в байтах. Чем он больше, тем выше расход памяти.":
    "Maximum receive buffer per stream in bytes. Larger values use more memory.",
  "Начальный буфер подключения": "Initial connection buffer",
  "Начальный общий буфер одного клиентского подключения в байтах.":
    "Initial total receive buffer for one client connection in bytes.",
  "Максимальный буфер подключения": "Maximum connection buffer",
  "Максимальный общий буфер подключения в байтах.": "Maximum total connection buffer in bytes.",
  "Одновременные потоки": "Concurrent streams",
  "Число одновременных потоков на подключение. Низкий предел может замедлить открытие сайтов.":
    "Number of simultaneous streams allowed per connection. A low limit may slow down websites.",
  "Таймаут соединения": "Connection idle timeout",
  "Как долго ждать пакеты перед закрытием неактивного соединения.":
    "How long to wait for packets before closing an idle connection.",
  "Не подбирать размер пакетов": "Disable packet size discovery",
  "Отключает подбор размера пакета. Меняйте только для диагностики сети.":
    "Disable automatic path MTU discovery. Change this only when diagnosing network issues.",
  "Отключить быстрый сброс сессий": "Disable stateless resets",
  "Дополнительные параметры QUIC. Если не настраивали их, оставьте по умолчанию.":
    "Additional QUIC settings. Keep the defaults unless you need to change them.",
  "Маскировка трафика": "Traffic obfuscation",
  "Меняет вид UDP-пакетов. Для ссылки подключения выберите Salamander. После смены обновите подписку.":
    "Changes the appearance of UDP packets. Choose Salamander for connection link export. Refresh client subscriptions after changing it.",
  "Пароль маскировки": "Obfuscation password",
  "Этот пароль должен совпадать на сервере и в приложении. Панель добавит его в ссылку подключения.":
    "This password must match on the server and in your app. The panel includes it in connection links.",
};
