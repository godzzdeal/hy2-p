#!/usr/bin/env bash
rollback_panel() {
  local current=$1 previous snapshot safety answer
  previous=$(cat "$ROOT/previous" 2>/dev/null || true)
  snapshot=$(cat "$ROOT/rollback-backup" 2>/dev/null || true)
  valid_sha "$previous" && [[ -n $snapshot ]] || die "Предыдущая версия отсутствует."
  if [[ $(env_read PANEL_MIMIC_ENABLED) == true ]]; then
    # shellcheck source=/dev/null
    source "$(dirname -- "${BASH_SOURCE[0]}")/../mimic/compose.sh"
    mimic_release_supported "$previous"
  fi
  if [[ ${2:-} != --yes ]]; then
    log "Откат восстановит версию и данные на момент $snapshot."
    log "Текущие данные сначала будут сохранены в отдельную копию."
    read -r -p 'Продолжить? [yes/NO]: ' answer </dev/tty
    [[ $answer == yes ]] || return 0
  fi
  restore_image "$previous" || return 1
  compose "$current" stop panel
  if ! safety=$(create_backup "$current"); then
    start_release "$current" || true
    die "Текущие данные не сохранены; откат отменён."
  fi
  jq -n --arg old "$current" --arg next "$previous" --arg backup "$safety" \
    --arg previous "$previous" --arg previousBackup "$snapshot" \
    '{old:$old,next:$next,backup:$backup,previous:$previous,previousBackup:$previousBackup}' >"$ROOT/.update.pending"
  mv -f -- "$ROOT/.update.pending" "$ROOT/update.pending"
  if restore_backup "$snapshot" "$previous" && start_release "$previous"; then
    state_write current "$previous"
    rm -f -- "$ROOT/previous" "$ROOT/rollback-backup" "$ROOT/update.pending"
    log "Откат завершён. Копия состояния до отката: $safety"
  else
    recover_pending || die "Возврат после ошибки отката не удался; копии сохранены."
    die "Откат не прошёл проверку; исходная версия восстановлена."
  fi
}
