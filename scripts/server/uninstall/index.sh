#!/usr/bin/env bash
# shellcheck source=docker.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/docker.sh"
# shellcheck source=host.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/host.sh"

uninstall_panel() {
  local option=${1:-} answer sha
  [[ $# -le 1 && ( -z $option || $option == --yes || $option == --dry-run ) ]] ||
    die "Используйте: sudo hy2-panel uninstall [--dry-run|--yes]"
  validate_root
  [[ -f $ROOT/.env && -f $ROOT/current && ! -L $ROOT/current && ! -L $ROOT/releases ]] ||
    die "Каталог не похож на установку HY2-P. Ничего не удалено."
  sha=$(cat "$ROOT/current")
  valid_sha "$sha" && [[ -f $ROOT/releases/$sha/compose.yaml ]] ||
    die "Не удалось подтвердить каталог установки. Ничего не удалено."
  lock_deployment
  uninstall_host_check || die "Не удалось проверить помощник. Ничего не удалено."
  uninstall_inventory || die "Не удалось получить список ресурсов Docker. Ничего не удалено."
  log "Полное удаление HY2-P из $ROOT"
  log 'Будут удалены пользователи, конфигурации, сертификаты, резервные копии и архивы отката.'
  log "Контейнеры: ${UNINSTALL_CONTAINERS:-нет}"
  log "Тома данных: ${UNINSTALL_VOLUMES:-нет}"
  log "Сети Docker: ${UNINSTALL_NETWORKS:-нет}"
  log "Образы без других потребителей: ${UNINSTALL_IMAGES:-нет}"
  [[ $UNINSTALL_HELPER != true ]] || log 'Будет удалён помощник hy2-panel-firewall.service.'
  log 'Docker, другие приложения и правила UFW сохранятся.'
  [[ $option != --dry-run ]] || return 0
  if [[ $option != --yes ]]; then
    printf 'Удалить HY2-P и все его данные без возможности отката? [yes/no]: ' >&2
    if ! read -r answer || [[ ! $answer =~ ^([yY]|[yY][eE][sS])$ ]]; then
      log 'Удаление отменено.'
      return 0
    fi
  fi
  uninstall_docker || die "Очистка Docker не завершена. Файлы установки сохранены; устраните ошибку и повторите команду."
  uninstall_host_remove || die "Помощник не удалён. Файлы установки сохранены; повторите команду после исправления."
  # Revalidate immediately before recursive removal; never follow a replaced installation path.
  validate_root
  [[ -f $ROOT/current && $(cat "$ROOT/current") == "$sha" ]] || die "Установка изменилась. Каталог сохранён."
  cd /
  rm -rf --one-file-system -- "$ROOT" || die "Не удалось удалить каталог установки: $ROOT"
  [[ ! -e $ROOT ]] || die "В каталоге остались подключённые файловые системы: $ROOT"
  log 'HY2-P удалена вместе с данными и резервными копиями этой установки.'
}
