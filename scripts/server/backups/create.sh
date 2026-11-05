#!/usr/bin/env bash
create_backup() {
  local sha=$1 target
  check_volume
  mkdir -p -- "$ROOT/backups"
  target=$(mktemp -d "$ROOT/backups/$(date -u +%Y%m%dT%H%M%SZ).XXXXXX")
  chmod 700 "$target"
  log "Сохраняем данные и ключи: $target"
  if ! engine run --rm --network none --read-only -v "$VOLUME:/data:ro" \
    --entrypoint tar "$(image_for "$sha")" -C /data -czf - . >"$target/data.tar.gz"; then return 1; fi
  tar -tzf "$target/data.tar.gz" >/dev/null || return 1
  tar -C "$ROOT" -czf "$target/certs.tar.gz" certs || return 1
  cp -- "$ROOT/.env" "$target/environment" || return 1
  jq -n --arg commit "$sha" --arg created "$(date -u +%FT%TZ)" \
    '{format:1,commit:$commit,created:$created}' >"$target/manifest.json" || return 1
  chmod 600 "$target/"* || return 1
  printf '%s\n' "$target"
}
backup_panel() {
  local sha=$1 identifier running=false snapshot result=0
  identifier=$(compose "$sha" ps -aq panel)
  if [[ -n $identifier && $(engine inspect --format '{{.State.Running}}' "$identifier") == true ]]; then running=true; fi
  compose "$sha" stop panel
  snapshot=$(create_backup "$sha") || result=1
  if [[ $running == true ]]; then start_release "$sha" || result=1; fi
  ((result==0)) || die "Резервное копирование или повторный запуск не удались."
  log "Резервная копия готова: $snapshot"
}
