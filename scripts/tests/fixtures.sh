#!/usr/bin/env bash
TEST_SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
OLD=1111111111111111111111111111111111111111
NEW=2222222222222222222222222222222222222222
setup_case() {
  export HY2_INSTALL_DIR=$WORK/$1
  # shellcheck source=/dev/null
  source "$TEST_SOURCE/server/common.sh"
  mkdir -p "$ROOT/releases/$OLD" "$ROOT/releases/$NEW" "$ROOT/backups" "$ROOT/certs" "$ROOT/fake-data/secrets"
  printf 'services: {}\n' >"$ROOT/releases/$OLD/compose.yaml"
  cp "$ROOT/releases/$OLD/compose.yaml" "$ROOT/releases/$NEW/compose.yaml"
  printf 'PANEL_PORT=8080\nPANEL_BIND=127.0.0.1\nPANEL_ACME_ENABLED=false\n' >"$ROOT/.env"
  printf 'private-test-key' >"$ROOT/fake-data/secrets/users.key"
  printf '%s\n' "$OLD" >"$ROOT/current"
  printf '%s\n' "$OLD" >"$ROOT/active"
  FAIL_NEW=false; FAIL_OLD=false; BUILD_FAIL=false; BACKUP_FAIL=false; CHANGE_DATA=false
  for file in listener backups/create backups/restore releases/source/fetch releases/update releases/rollback; do
    # shellcheck source=/dev/null
    source "$TEST_SOURCE/server/$file.sh"
  done
  mock_functions
}
mock_functions() {
engine() {
  case $1 in
    volume)
      if [[ $* == *--format* ]]; then printf '%s\n' "$ROOT"; fi ;;
    inspect) printf 'true\n' ;;
    exec) printf '{"httpChallenge":true,"udpPublicPort":"61254","udpListenPort":"61254"}\n' ;;
    run)
      if [[ $* == *'--entrypoint tar'* ]]; then
        [[ $BACKUP_FAIL != true ]] || return 1
        tar -C "$ROOT/fake-data" -czf - .
      elif [[ $* == *'--user 0'* ]]; then
        [[ $ROOT == "$WORK/"* ]] || return 1
        find "$ROOT/fake-data" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} \;
        tar -xzf - -C "$ROOT/fake-data"
      else
        printf '{"port":9443,"mode":"acme","challengePort":9080}\n'
      fi ;;
    *) printf 'unexpected engine command\n' >&2; return 1 ;;
  esac
}
compose() {
  local sha=$1 action=$2
  printf '%s %s\n' "$action" "$sha" >>"$ROOT/events"
  case $action in
    build) [[ $BUILD_FAIL != true ]] ;;
    stop) printf 'stopped\n' >"$ROOT/active" ;;
    up)
      printf '%s\n' "$sha" >"$ROOT/active"
      if [[ $sha == "$NEW" && $CHANGE_DATA == true ]]; then printf 'changed' >"$ROOT/fake-data/secrets/users.key"; fi ;;
    ps) printf 'test-container\n' ;;
    logs) : ;;
    *) return 1 ;;
  esac
}
wait_healthy() {
  [[ $1 != "$NEW" || $FAIL_NEW != true ]] && [[ $1 != "$OLD" || $FAIL_OLD != true ]]
}
prepare_image() { compose "$1" build --pull panel; }
fetch_release() { printf '%s\n' "$NEW"; }
sync_listener() { :; }
show_access() { :; }
assert_equal() { [[ $1 == "$2" ]] || { printf 'Expected <%s>, got <%s>\n' "$2" "$1" >&2; exit 1; }; }

}
