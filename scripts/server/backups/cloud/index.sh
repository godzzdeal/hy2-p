#!/usr/bin/env bash
# Optional transfer image is downloaded only when cloud backup is used.
RCLONE_IMAGE=rclone/rclone:1.76.0
cloud_backup() (
  local sha=$1 id=${2:-} action=${3:-backup-cloud} destination work archive fingerprint server
  [[ -z $id || $id == legacy || $id =~ ^[a-f0-9]{32}$ ]] || die 'Некорректный ID хранилища.'
  [[ $action == backup-cloud || $action == check-cloud ]] || return 1
  mkdir -p "$ROOT/backups" "$ROOT/cloud-backup"
  work=$(mktemp -d "$ROOT/backups/.cloud-XXXXXXXX") || return 1
  finish_transfer() {
    if [[ -s $work/rclone.conf ]]; then
      compose "$sha" run --rm --no-deps -T --entrypoint /usr/local/bin/port-agent port-agent cloud-save "$id" "$work/rclone.conf" || log 'Не удалось сохранить обновлённый токен хранилища.'
    fi
    rm -rf -- "$work"
  }
  trap finish_transfer EXIT
  chmod 700 "$work"
  # The helper refreshes OAuth credentials before the panel is stopped.
  compose "$sha" run --rm --no-deps -T --entrypoint /usr/local/bin/port-agent port-agent cloud-config "$id" >"$work/transfer.json" || return 1
  destination=$(jq -er '.destination | select(type=="string" and test("^[a-zA-Z0-9_-]+:") and (explode | all(. >= 32)))' "$work/transfer.json") || return 1
  [[ $destination != *..* && $destination != *\\* ]] || return 1
  jq -er '.configText' "$work/transfer.json" >"$work/rclone.conf" || return 1
  chmod 600 "$work/rclone.conf"
  # Fetch before stopping the panel; a registry outage must not interrupt it.
  engine image inspect "$RCLONE_IMAGE" >/dev/null 2>&1 || engine pull "$RCLONE_IMAGE" || return 1
  run_rclone() {
    engine run --rm --read-only --cap-drop ALL --security-opt no-new-privileges \
      --mount "type=bind,src=$work,dst=/transfer" --tmpfs /tmp \
      "$RCLONE_IMAGE" --config /transfer/rclone.conf --cache-dir /tmp --retries 2 --low-level-retries 3 --timeout 60s "$@" \
      >"$ROOT/cloud-backup/last-transfer.log" 2>&1
  }
  if [[ $action == check-cloud ]]; then
    run_rclone mkdir "$destination" || return 1
    run_rclone lsf "$destination" --max-depth 1 || return 1
    log 'Доступ к хранилищу проверен.'
    return
  fi
  backup_panel "$sha" || return 1
  tar -C "$LAST_BACKUP" -czf "$work/backup.tar.gz" . || return 1
  fingerprint=$(sha256sum "$work/backup.tar.gz"); fingerprint=${fingerprint:0:12}
  server=$(engine info --format '{{.Name}}' 2>/dev/null | tr -cd 'a-zA-Z0-9_-') || server=server
  server=${server:-server}
  archive="hy2-p-${server}-$(date -u +%Y%m%dT%H%M%SZ)-${fingerprint}-backup.tar.gz"
  mkdir "$work/files"
  mv -- "$work/backup.tar.gz" "$work/files/$archive" || return 1
  run_rclone copyto "/transfer/files/$archive" "${destination%/}/$archive" || { log 'Загрузка не удалась; локальная копия сохранена.'; return 1; }
  run_rclone check /transfer/files "${destination%/}" --one-way --download || { log 'Не удалось проверить облачную копию.'; return 1; }
  log 'Облачная резервная копия загружена и проверена.'
)
