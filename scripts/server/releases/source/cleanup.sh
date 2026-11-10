#!/usr/bin/env bash
# shellcheck source=../images/archive.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/../images/archive.sh"
# shellcheck source=../images/containers.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/../images/containers.sh"
cleanup_images() {
  local current=$1 previous sha reference containers candidates removed=0 archived=false
  previous=$(cat "$ROOT/previous" 2>/dev/null || true)
  valid_sha "$current" || return 1
  [[ ! -f $ROOT/update.pending && ! -f $ROOT/udp.pending ]] || die "Сначала завершите текущую операцию."
  cleanup_containers "$current" || return 1
  if valid_sha "$previous" && [[ $previous != "$current" ]]; then
    archive_image "$previous" || { log "Предыдущий образ не удалён: архив не прошёл проверку."; return 1; }
    archived=true
  fi
  candidates=$(engine image ls --no-trunc --filter label=io.hy2-panel.commit --format '{{.ID}}') || return 1
  for reference in $candidates; do
    [[ $reference =~ ^sha256:[a-f0-9]{64}$ ]] || continue
    sha=$(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$reference") || continue
    valid_sha "$sha" || continue
    [[ $sha != "$current" && -d $ROOT/releases/$sha ]] || continue
    [[ $sha != "$previous" || $archived == true ]] || continue
    containers=$(engine ps -aq --filter "ancestor=$reference") || return 1
    [[ -z $containers ]] || continue
    # No force: Docker refuses removal if a container starts using the image meanwhile.
    if engine image rm "$reference"; then removed=$((removed+1)); else
      containers=$(engine ps -aq --filter "ancestor=$reference") || return 1
      [[ -n $containers ]] || return 1
    fi
  done
  prune_image_archives "$previous" || return 1
  if [[ $archived == false ]] || ! engine image inspect "$(image_for "$previous")" >/dev/null 2>&1; then
    state_write images-maintained "$current:$previous" || return 1
  fi
  log "Удалено старых образов: $removed. Работающая версия сохранена, предыдущая доступна из архива."
}
