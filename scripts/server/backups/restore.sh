#!/usr/bin/env bash
restore_backup() {
  local snapshot=$1 sha=$2 certs_saved
  [[ $snapshot == "$ROOT/backups/"* && $(readlink -m -- "$snapshot") == "$snapshot" && ! -L $snapshot ]] ||
    die "Недопустимый путь резервной копии."
  [[ -f $snapshot/data.tar.gz && -f $snapshot/environment && -f $snapshot/certs.tar.gz ]] ||
    die "Резервная копия неполная."
  [[ $(jq -r '.format' "$snapshot/manifest.json") == 1 && $(jq -r '.commit' "$snapshot/manifest.json") == "$sha" ]] ||
    die "Версия резервной копии не совпадает."
  check_volume
  engine volume inspect "$VOLUME" >/dev/null || return 1
  tar -tzf "$snapshot/data.tar.gz" >/dev/null || return 1
  tar -tzf "$snapshot/certs.tar.gz" >/dev/null || return 1
  log "Восстанавливаем согласованную резервную копию $snapshot"
  engine run --rm -i --network none --user 0 -v "$VOLUME:/data" \
    --entrypoint sh "$(image_for "$sha")" -ec \
    'find /data -mindepth 1 -maxdepth 1 -exec rm -rf -- {} \; ; tar -xzf - -C /data' \
    <"$snapshot/data.tar.gz" || return 1
  [[ ! -L $ROOT/certs ]] || die "Папка сертификатов стала символической ссылкой."
  certs_saved=$(mktemp -d "$ROOT/.certs-before-restore.XXXXXX")
  mv -- "$ROOT/certs" "$certs_saved/certs"
  tar -xzf "$snapshot/certs.tar.gz" -C "$ROOT" || return 1
  cp -- "$snapshot/environment" "$ROOT/.env.restoring" || return 1
  chmod 600 "$ROOT/.env.restoring" || return 1
  mv -f -- "$ROOT/.env.restoring" "$ROOT/.env"
}
