#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"
require_root
for file in listener ports/verify ports/recover ports/apply backups/create backups/restore releases/source/fetch releases/source/image releases/update releases/rollback; do
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
  status|logs|start|stop|restart|update|rollback|backup|url|apply-udp|recover-udp) ;;
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
    if [[ $command != recover-udp ]]; then recover_udp || die "Не удалось восстановить UDP-порты."; fi
    recover_pending || die "Сначала нужно восстановить прерванную операцию."
    current=$(cat "$ROOT/current")
    case $command in
      apply-udp) apply_udp "$current" "${2:-}" "${3:-}" "${4:-}" ;;
      recover-udp)
        if [[ -f $ROOT/udp.pending ]]; then
          if recover_udp; then exit 10; else exit 11; fi
        elif [[ $(cat "$ROOT/udp-completed" 2>/dev/null || true) == "${2:-}" ]] && verify_udp_core "$current"; then exit 0
        else exit 10; fi ;;
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
