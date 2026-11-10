#!/usr/bin/env bash
archive_directory() {
  valid_sha "$1" && [[ ! -L $ROOT/image-archives ]] || return 1
  printf '%s/image-archives/%s\n' "$ROOT" "$1"
}
verify_image_archive() {
  local sha=$1 directory expected actual manifest config
  directory=$(archive_directory "$sha") || return 1
  if [[ -n ${2:-} ]]; then
    [[ $2 == "$ROOT/image-archives/.archive."* && ${2%/*} == "$ROOT/image-archives" && $(readlink -m -- "$2") == "$2" ]] || return 1
    directory=$2
  fi
  [[ -d $directory && ! -L $directory && -f $directory/image.tar.gz && ! -L $directory/image.tar.gz && ! -L $directory/checksum ]] || return 1
  expected=$(cat "$directory/checksum") || return 1
  [[ $expected =~ ^[a-f0-9]{64}$ ]] || return 1
  actual=$(sha256sum "$directory/image.tar.gz") || return 1
  [[ ${actual%% *} == "$expected" ]] || return 1
  gzip -t "$directory/image.tar.gz" || return 1
  manifest=$(tar -xzOf "$directory/image.tar.gz" manifest.json) || return 1
  config=$(jq -er --arg tag "$(image_for "$sha")" \
    'if length == 1 and (.[0].RepoTags | index($tag)) != null then .[0].Config else error("image tag mismatch") end' <<<"$manifest") || return 1
  [[ $config =~ ^(blobs/sha256/)?[a-f0-9]{64}(\.json)?$ ]] || return 1
  tar -xzOf "$directory/image.tar.gz" "$config" | jq -e --arg sha "$sha" '.config.Labels["io.hy2-panel.commit"] == $sha' >/dev/null
}
archive_image() (
  local sha=$1 directory temporary checksum
  directory=$(archive_directory "$sha") || return 1
  if [[ -e $directory ]]; then verify_image_archive "$sha"; return; fi
  mkdir -p -- "$ROOT/image-archives" || return 1
  chmod 700 "$ROOT/image-archives" || return 1
  temporary=$(mktemp -d "$ROOT/image-archives/.archive.XXXXXX") || return 1
  trap 'if [[ -n ${temporary:-} ]]; then rm -f -- "$temporary/image.tar.gz" "$temporary/checksum"; rmdir -- "$temporary"; fi' EXIT
  log "Сжимаем предыдущий образ для отката: $sha"
  if ! (set -o pipefail; engine image save "$(image_for "$sha")" | nice -n 10 gzip -6 >"$temporary/image.tar.gz"); then
    return 1
  fi
  checksum=$(sha256sum "$temporary/image.tar.gz") || return 1
  printf '%s\n' "${checksum%% *}" >"$temporary/checksum" || return 1
  chmod 600 "$temporary/"* || return 1
  verify_image_archive "$sha" "$temporary" || return 1
  mv -T -- "$temporary" "$directory" || return 1
  temporary=""
)
restore_image() {
  local sha=$1 directory
  if [[ $(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$(image_for "$sha")" 2>/dev/null || true) == "$sha" ]]; then return 0; fi
  directory=$(archive_directory "$sha") || return 1
  verify_image_archive "$sha" || { log "Архив образа отсутствует или повреждён. Работающая панель сохранена."; return 1; }
  log "Загружаем образ для отката из локального архива: $sha"
  engine load --input "$directory/image.tar.gz" || return 1
  [[ $(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$(image_for "$sha")") == "$sha" ]]
}
prune_image_archives() {
  local previous=$1 directory sha
  [[ ! -L $ROOT/image-archives ]] || return 1
  for directory in "$ROOT/image-archives/"*; do
    sha=${directory##*/}
    valid_sha "$sha" && [[ $sha != "$previous" && -d $directory && ! -L $directory ]] || continue
    rm -rf -- "$directory" || return 1
  done
  # The deployment lock excludes a live exporter; these are interrupted exports.
  for directory in "$ROOT/image-archives/".archive.*; do
    [[ -d $directory && ! -L $directory ]] || continue
    rm -rf -- "$directory" || return 1
  done
}
