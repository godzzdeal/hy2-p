#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"
require_root
for file in listener transfer account/index ports/mappings ports/transaction/verify ports/transaction/recover ports/transaction/apply backups/create backups/restore releases/source/fetch releases/source/image releases/update releases/rollback; do
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
    printf '%s\n' '  firewall-setup         Подключить помощник управления UFW'
    printf '%s\n' '  cloud-password-reset   Отключить забытый облачный пароль'
    printf '%s\n' '  password-reset         Создать новый пароль администратора'
    printf '%s\n' '  export <файл.json>     Экспорт ядер, групп и пользователей' '  import <файл.json> [--apply] Просмотр совпадений или добавление записей'
    exit 0 ;;
  status|logs|start|stop|restart|update|rollback|backup|url|apply-udp|remove-udp|recover-udp|firewall-setup|cloud-password-reset|password-reset|import|export) ;;
  *) die "Неизвестная команда: $command" ;;
esac
[[ -f $ROOT/.env && -f $ROOT/current ]] || die "Установка не найдена."
current=$(cat "$ROOT/current")
valid_sha "$current" || die "Повреждён файл текущей версии."
case $command in
  import|export) transfer_panel "$current" "$command" "${@:2}"; exit ;;
  firewall-setup) bash "$SCRIPT_DIR/../firewall-setup.sh"; exit ;;
  status) compose "$current" ps; printf 'Commit: %s\n' "$current" ;;
  logs) compose "$current" logs --follow --tail=100 panel ;;
  url) show_access ;;
  *)
    lock_deployment
    if [[ $command != recover-udp ]]; then recover_udp || die "Не удалось восстановить UDP-порты."; fi
    recover_pending || die "Сначала нужно восстановить прерванную операцию."
    current=$(cat "$ROOT/current")
    case $command in
      password-reset) reset_admin_password "$current" ;;
      cloud-password-reset) cloud_password_reset "$current" ;;
      apply-udp) apply_udp "$current" "${2:-}" "${3:-}" "${4:-}" "${5:-default}" ;;
      remove-udp) remove_udp "$current" "${2:-}" "${3:-}" "${4:-}" "${5:-}" ;;
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
