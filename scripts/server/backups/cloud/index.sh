#!/usr/bin/env bash
# Optional transfer image is downloaded only when cloud backup is used.
RCLONE_IMAGE=rclone/rclone:1.76.0
cloud_backup() (
  local sha=$1 settings destination work archive fingerprint server
  [[ -d $ROOT/cloud-backup ]] || die 'Сначала подключите облачное хранилище в настройках панели.'
  settings=$(find "$ROOT/cloud-backup" -maxdepth 1 -name 'settings-*.json' -type f | sort | tail -n 1)
  [[ -n $settings ]] || die 'Сначала подключите облачное хранилище в настройках панели.'
  destination=$(jq -er '.destination | select(type=="string" and test("^[a-zA-Z0-9_-]+:") and (explode | all(. >= 32)))' "$settings") || return 1
  [[ $destination != *..* && $destination != *\\* ]] || return 1
  work=$(mktemp -d "$ROOT/backups/.cloud-XXXXXXXX") || return 1
  finish_transfer() {
    if [[ -s $work/rclone.conf ]]; then
      if jq --rawfile config "$work/rclone.conf" '.configText=$config' "$settings" >"$work/settings.json"; then
        chmod 600 "$work/settings.json"
        mv -- "$work/settings.json" "$settings" || log 'Не удалось сохранить обновлённый токен хранилища.'
      fi
    fi
    rm -rf -- "$work"
  }
  trap finish_transfer EXIT
  chmod 700 "$work"
  jq -er '.configText' "$settings" >"$work/rclone.conf" || return 1
  chmod 600 "$work/rclone.conf"
  # Fetch before stopping the panel; a registry outage must not interrupt it.
  engine image inspect "$RCLONE_IMAGE" >/dev/null 2>&1 || engine pull "$RCLONE_IMAGE" || return 1
  backup_panel "$sha" || return 1
  tar -C "$LAST_BACKUP" -czf "$work/backup.tar.gz" . || return 1
  fingerprint=$(sha256sum "$work/backup.tar.gz"); fingerprint=${fingerprint:0:12}
  server=$(engine info --format '{{.Name}}' 2>/dev/null | tr -cd 'a-zA-Z0-9_-') || server=server
  server=${server:-server}
  archive="hy2-p-${server}-$(date -u +%Y%m%dT%H%M%SZ)-${fingerprint}-backup.tar.gz"
  mkdir "$work/files"
  mv -- "$work/backup.tar.gz" "$work/files/$archive" || return 1
  run_rclone() {
    engine run --rm --read-only --cap-drop ALL --security-opt no-new-privileges \
      --mount "type=bind,src=$work,dst=/transfer" --tmpfs /tmp \
      "$RCLONE_IMAGE" --config /transfer/rclone.conf --cache-dir /tmp --retries 2 --low-level-retries 3 --timeout 60s "$@" \
      >"$ROOT/cloud-backup/last-transfer.log" 2>&1
  }
  run_rclone copyto "/transfer/files/$archive" "${destination%/}/$archive" || { log 'Загрузка не удалась; локальная копия сохранена.'; return 1; }
  run_rclone check /transfer/files "${destination%/}" --one-way --download || { log 'Не удалось проверить облачную копию.'; return 1; }
  log 'Облачная резервная копия загружена и проверена.'
)
