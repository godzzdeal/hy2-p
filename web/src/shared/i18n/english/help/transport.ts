export const TRANSPORT_HELP = {
  "Порт Hysteria2": "Hysteria2 port",
  "Например :61254. Это порт VPN внутри контейнера. Порт входа в веб-панель настраивается отдельно.":
    "For example :61254. This is the VPN port inside the container. The web panel port is configured separately.",
  "Скорость скачивания у клиента": "Client download speed",
  "Лимит для каждого подключения в режиме Brutal, например 100 mbps. Пустое поле означает отсутствие лимита.":
    "Per-connection limit in Brutal mode, for example 100 mbps. Leave empty for no limit.",
  "Скорость отправки у клиента": "Client upload speed",
  "Лимит передачи данных от клиента к серверу в режиме Brutal, например 50 mbps. На BBR и Reno не влияет.":
    "Client-to-server limit in Brutal mode, for example 50 mbps. Has no effect on BBR or Reno.",
  "Отключить компенсацию потерь": "Disable loss compensation",
  "В режиме Brutal сервер может отправлять чуть больше данных при потерях. Включите, чтобы строго соблюдать заданную скорость.":
    "In Brutal mode, the server may send extra data to compensate for losses. Enable this to keep the configured rate.",
  "Игнорировать скорость клиента": "Ignore client bandwidth",
  "Сервер будет использовать BBR или Reno, даже если клиент запросил Brutal. Подходит для работы без ручной настройки скорости.":
    "Use BBR or Reno even when a client requests Brutal. Useful when you do not want to configure bandwidth manually.",
  "Контроль перегрузки": "Congestion control",
  "BBR подбирает скорость под качество сети. Reno обычно осторожнее. Если не уверены, оставьте BBR.":
    "BBR adapts to network conditions. Reno is generally more conservative. Leave BBR selected if unsure.",
  "Профиль BBR": "BBR profile",
  "Standard подходит для обычного использования. Conservative снижает напор, aggressive увеличивает его.":
    "Standard suits most connections. Conservative sends less aggressively; aggressive sends more aggressively.",
  "Тест скорости": "Speed test",
  "Разрешить встроенную проверку скорости Hysteria2. Это не проверка доступности сайтов.":
    "Allow the built-in Hysteria2 speed test. This does not check whether websites are reachable.",
  "Запретить UDP-запросы клиентов": "Block client UDP requests",
  "Отключает UDP-трафик внутри VPN, например для игр и звонков. Само подключение Hysteria2 продолжит использовать UDP.":
    "Blocks UDP traffic inside the VPN, such as games and calls. Hysteria2 itself still uses UDP.",
  "Таймаут UDP": "UDP idle timeout",
  "Через сколько закрывать неактивный UDP-поток, например 60s.":
    "How long an idle UDP stream stays open, for example 60s.",
  "Начальный буфер потока": "Initial stream buffer",
  "Начальный объём буфера для одного потока. Обычно менять не нужно.":
    "Initial receive buffer for one stream. Usually no change is needed.",
  "Максимальный буфер потока": "Maximum stream buffer",
  "Максимальный буфер одного потока в байтах. Большие значения увеличивают расход памяти.":
    "Maximum receive buffer per stream in bytes. Larger values use more memory.",
  "Начальный буфер подключения": "Initial connection buffer",
  "Начальный общий буфер одного клиентского подключения в байтах.":
    "Initial total receive buffer for one client connection in bytes.",
  "Максимальный буфер подключения": "Maximum connection buffer",
  "Верхний предел общего буфера подключения. Оставьте стандартное значение, если нет конкретной причины менять.":
    "Maximum total receive buffer per connection. Keep the default unless you have a specific reason to change it.",
  "Одновременные потоки": "Concurrent streams",
  "Сколько параллельных потоков разрешено одному подключению. Низкий предел может замедлять открытие сайтов.":
    "Number of simultaneous streams allowed per connection. A low limit may slow down websites.",
  "Таймаут соединения": "Connection idle timeout",
  "Как долго ждать пакеты перед закрытием неактивного соединения.":
    "How long to wait for packets before closing an idle connection.",
  "Не подбирать размер пакетов": "Disable packet size discovery",
  "Отключает автоматический поиск подходящего размера пакета. Меняйте только при диагностике проблем сети.":
    "Disable automatic path MTU discovery. Change this only when diagnosing network issues.",
  "Отключить быстрый сброс сессий": "Disable stateless resets",
  "Расширенная настройка QUIC. Для обычного сервера оставьте значение по умолчанию.":
    "Advanced QUIC setting. Keep the default for normal use.",
  "Маскировка трафика": "Traffic obfuscation",
  "Меняет внешний вид UDP-пакетов. Для импорта в Happ выберите Salamander. После смены обновите подписку клиента.":
    "Changes the appearance of UDP packets. Choose Salamander for Happ URI import. Refresh client subscriptions after changing it.",
  "Пароль маскировки": "Obfuscation password",
  "Этот пароль должен совпадать на сервере и в Happ. Панель добавит его в ссылку подключения.":
    "This password must match on the server and in Happ. The panel includes it in connection links.",
};
