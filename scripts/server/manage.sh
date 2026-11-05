#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"
require_root
for file in listener backups/create backups/restore releases/fetch releases/update releases/rollback; do
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/$file.sh"
done
command=${1:-help}
case $command in
  help|-h|--help)
    printf '%s\n' 'sudo hy2-panel <command>' \
      '  status                 Состояние панели и контейнера' \
      '  logs                   Просмотр журнала (Ctrl+C для выхода)' \
      '  start | stop | restart Управление панелью' \
      '  update [vX.Y.Z|main]    Новая версия с резервной копией и проверкой' \
      '  rollback [--yes]       Предыдущая версия и данные из её копии' \
      '  backup                 Согласованная резервная копия данных и ключей' \
      '  url                    Адрес панели или SSH-туннель'
    exit 0 ;;
  status|logs|start|stop|restart|update|rollback|backup|url) ;;
  *) die "Неизвестная команда: $command" ;;
esac
[[ -f $ROOT/.env && -f $ROOT/current ]] || die "Установка не найдена."
current=$(cat "$ROOT/current")
valid_sha "$current" || die "Повреждён файл текущей версии."
case $command in
  status) compose "$current" ps; printf 'Commit: %s\n' "$current" ;;
  logs) compose "$current" logs --follow --tail=100 panel ;;
  url) show_access ;;
  *)
    lock_deployment
    recover_pending || die "Сначала нужно восстановить прерванную операцию."
    current=$(cat "$ROOT/current")
    case $command in
      update) update_panel "$current" "${2:-latest}" ;;
      rollback) rollback_panel "$current" "${2:-}" ;;
      backup) backup_panel "$current" ;;
      stop) compose "$current" stop panel ;;
      start|restart)
        sync_listener "$current"
        if [[ $command == restart ]]; then compose "$current" stop panel; fi
        start_release "$current" || die "Панель не прошла проверку запуска."
        show_access ;;
    esac ;;
esac
