#!/usr/bin/env bash
cleanup_images() {
  local current=$1 previous sha reference containers candidates removed=0
  previous=$(cat "$ROOT/previous" 2>/dev/null || true)
  valid_sha "$current" && valid_sha "$previous" || die "Для очистки нужна сохранённая предыдущая версия."
  [[ ! -f $ROOT/update.pending && ! -f $ROOT/udp.pending ]] || die "Сначала завершите текущую операцию."
  candidates=$(engine image ls --filter 'reference=hy2-panel:*' --format '{{.Tag}}') || return 1
  for sha in $candidates; do
    valid_sha "$sha" || continue
    [[ $sha != "$current" && $sha != "$previous" && -d $ROOT/releases/$sha ]] || continue
    reference=$(image_for "$sha")
    [[ $(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$reference") == "$sha" ]] || continue
    containers=$(engine ps -aq --filter "ancestor=$reference") || return 1
    [[ -z $containers ]] || continue
    # No force: Docker refuses removal if a container starts using the image meanwhile.
    if engine image rm "$reference"; then removed=$((removed+1)); else
      containers=$(engine ps -aq --filter "ancestor=$reference") || return 1
      [[ -n $containers ]] || return 1
    fi
  done
  log "Удалено старых образов: $removed. Текущая и предыдущая версии сохранены."
}
