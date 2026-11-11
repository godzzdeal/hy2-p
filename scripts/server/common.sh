#!/usr/bin/env bash
# Shared deployment primitives. Never source the .env file as shell code.
ROOT=${HY2_INSTALL_DIR:-/opt/hy2-panel}
PROJECT=hy2-panel
VOLUME=hy2-panel_panel-data
export REPOSITORY=https://github.com/godzzdeal/hy2-p.git
log() { printf '%s\n' "$*" >&2; }
die() { log "Ошибка: $*"; exit 1; }
validate_root() {
  [[ $ROOT =~ ^/[a-zA-Z0-9/_.-]+$ && $ROOT != / && $ROOT != /opt && $ROOT != /tmp ]] ||
    die "Укажите отдельную абсолютную папку установки."
  [[ $(readlink -m -- "$ROOT") == "$ROOT" && ! -L $ROOT ]] || die "Путь установки содержит ссылку или .."
}
require_root() { [[ $EUID == 0 ]] || die "Запустите команду через sudo."; }
lock_deployment() {
  mkdir -p -- "$ROOT"
  exec 9>"$ROOT/.deployment.lock"
  flock -n 9 || die "Другая операция уже выполняется."
}
env_read() { sed -n "s/^$1=//p" "$ROOT/.env" | head -n 1; }
env_set() {
  local temporary
  temporary=$(mktemp "$ROOT/.env.XXXXXX")
  awk -v key="$1" -v value="$2" '
    BEGIN { found=0 }
    index($0,key "=")==1 { if (!found) print key "=" value; found=1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$ROOT/.env" >"$temporary"
  chmod 600 "$temporary"
  mv -f -- "$temporary" "$ROOT/.env"
}
engine() { command docker --host unix:///var/run/docker.sock "$@"; }
valid_sha() { [[ $1 =~ ^[0-9a-f]{40}$ ]]; }
release_path() {
  valid_sha "$1" || die "Некорректный идентификатор версии."
  [[ -f $ROOT/releases/$1/compose.yaml ]] || die "Версия не найдена: $1"
  printf '%s/releases/%s\n' "$ROOT" "$1"
}
image_for() { valid_sha "$1" || die "Некорректная версия."; printf 'hy2-panel:%s\n' "$1"; }
state_write() {
  local temporary
  temporary=$(mktemp "$ROOT/.state.XXXXXX")
  printf '%s\n' "$2" >"$temporary"
  mv -f -- "$temporary" "$ROOT/$1"
}
compose() {
  local sha=$1 release image
  shift
  release=$(release_path "$sha")
  image=$(image_for "$sha")
  local arguments=(--project-name "$PROJECT" --project-directory "$release" --env-file "$ROOT/.env" -f "$release/compose.yaml")
  if [[ -f $release/compose.managed.yaml ]]; then arguments+=(-f "$release/compose.managed.yaml"); fi
  if [[ -f $ROOT/compose-udp.json ]]; then arguments+=(-f "$ROOT/compose-udp.json"); fi
  if [[ $(env_read PANEL_ACME_ENABLED) == true ]]; then arguments+=(-f "$release/compose.acme.yaml"); fi
  PANEL_IMAGE=$image PANEL_CERTS_DIR=$ROOT/certs PANEL_INSTALL_DIR=$ROOT engine compose "${arguments[@]}" "$@"
}
check_volume() {
  local owner
  if engine volume inspect "$VOLUME" >/dev/null 2>&1; then
    owner=$(engine volume inspect --format '{{index .Labels "io.hy2-panel.install-dir"}}' "$VOLUME")
    [[ $owner == "$ROOT" ]] || die "Том $VOLUME принадлежит другой установке. Данные не изменены."
  fi
}
wait_healthy() {
  local sha=$1 identifier status attempt streak=0
  identifier=$(compose "$sha" ps -q panel)
  [[ -n $identifier ]] || return 1
  for ((attempt=0; attempt<60; attempt++)); do
    status=$(engine inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$identifier") || return 1
    case $status in
      "running healthy") streak=$((streak+1)); ((streak>=3)) && return 0 ;;
      exited*|dead*|restarting*) return 1 ;;
      *) streak=0 ;;
    esac
    sleep 2
  done
  return 1
}
restart_panel() {
  sync_listener "$1" || return 1
  if [[ $2 == restart-panel ]]; then compose "$1" stop panel || return 1; fi
  compose "$1" up -d --no-build --pull never --no-deps panel && wait_healthy "$1"
}
start_release() {
  local before
  compose "$1" up -d --no-build --pull never --remove-orphans && wait_healthy "$1" || return 1
  # A stopped or older panel cannot report its saved ports before first startup.
  before=$(sha256sum "$ROOT/.env")
  sync_listener "$1" || return 1
  if [[ $(sha256sum "$ROOT/.env") != "$before" ]]; then
    compose "$1" up -d --no-build --pull never --remove-orphans && wait_healthy "$1" || return 1
  fi
}
validate_root
