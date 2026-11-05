#!/usr/bin/env bash
recover_pending() {
  [[ -f $ROOT/update.pending ]] || return 0
  local old next snapshot previous previous_backup
  old=$(jq -er '.old' "$ROOT/update.pending")
  next=$(jq -er '.next' "$ROOT/update.pending")
  snapshot=$(jq -er '.backup' "$ROOT/update.pending")
  previous=$(jq -r '.previous // ""' "$ROOT/update.pending")
  previous_backup=$(jq -r '.previousBackup // ""' "$ROOT/update.pending")
  valid_sha "$old" && valid_sha "$next" || die "Повреждён журнал обновления."
  log "Возвращаем предыдущую версию после неудачного или прерванного обновления."
  compose "$next" stop panel || return 1
  restore_backup "$snapshot" "$old" || return 1
  start_release "$old" || { log "Предыдущая версия не прошла проверку. Копия и журнал сохранены."; return 1; }
  state_write current "$old" || return 1
  state_write previous "$previous" || return 1
  state_write rollback-backup "$previous_backup" || return 1
  rm -f -- "$ROOT/update.pending"
  log "Версия $old восстановлена."
}
update_panel() {
  local old=$1 next snapshot previous previous_backup
  next=$(fetch_release "${2:-latest}") || return 1
  if [[ $next == "$old" ]]; then log "Эта версия уже установлена."; return 0; fi
  log "Собираем новую версию; текущая панель продолжает работать."
  compose "$next" build --pull panel || return 1
  sync_listener "$old"
  compose "$old" stop panel || return 1
  if ! snapshot=$(create_backup "$old"); then
    start_release "$old" || true
    die "Резервная копия не создана. Обновление отменено."
  fi
  previous=$(cat "$ROOT/previous" 2>/dev/null || true)
  previous_backup=$(cat "$ROOT/rollback-backup" 2>/dev/null || true)
  jq -n --arg old "$old" --arg next "$next" --arg backup "$snapshot" \
    --arg previous "$previous" --arg previousBackup "$previous_backup" \
    '{old:$old,next:$next,backup:$backup,previous:$previous,previousBackup:$previousBackup}' >"$ROOT/.update.pending"
  mv -f -- "$ROOT/.update.pending" "$ROOT/update.pending"
  if start_release "$next"; then
    state_write previous "$old"
    state_write rollback-backup "$snapshot"
    state_write current "$next"
    rm -f -- "$ROOT/update.pending"
    log "Обновление завершено: $next"
    show_access
  else
    compose "$next" logs --tail=80 panel >&2 || true
    recover_pending || die "Автоматический откат не удался; журнал и резервная копия сохранены."
    log "Новая панель не запустилась. Предыдущая версия возвращена."
    return 1
  fi
}
