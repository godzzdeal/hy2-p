#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
WORK=$(mktemp -d /tmp/hy2-script-tests.XXXXXX)
cleanup() { [[ $WORK == /tmp/hy2-script-tests.* ]] && rm -rf -- "$WORK"; }
trap cleanup EXIT
# shellcheck source=fixtures.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/fixtures.sh"

setup_case success
update_panel "$OLD"
assert_equal "$(cat "$ROOT/current")" "$NEW"
assert_equal "$(cat "$ROOT/previous")" "$OLD"
snapshot=$(cat "$ROOT/rollback-backup")
assert_equal "$(tar -xOzf "$snapshot/data.tar.gz" ./secrets/users.key)" private-test-key
[[ ! -e $ROOT/update.pending ]]

setup_case failure
export FAIL_NEW=true CHANGE_DATA=true
if (update_panel "$OLD"); then printf 'Broken update accepted\n' >&2; exit 1; fi
assert_equal "$(cat "$ROOT/current")" "$OLD"
assert_equal "$(cat "$ROOT/active")" "$OLD"
assert_equal "$(cat "$ROOT/fake-data/secrets/users.key")" private-test-key
[[ ! -e $ROOT/update.pending ]]

setup_case build-failure
export BUILD_FAIL=true
if (update_panel "$OLD"); then exit 1; fi
assert_equal "$(cat "$ROOT/active")" "$OLD"
! grep -q '^stop ' "$ROOT/events"

setup_case backup-failure
export BACKUP_FAIL=true
if (update_panel "$OLD"); then exit 1; fi
assert_equal "$(cat "$ROOT/active")" "$OLD"
[[ ! -e $ROOT/update.pending ]]

setup_case rollback
update_panel "$OLD"
printf 'after-update' >"$ROOT/fake-data/secrets/users.key"
rollback_panel "$NEW" --yes
assert_equal "$(cat "$ROOT/current")" "$OLD"
assert_equal "$(cat "$ROOT/fake-data/secrets/users.key")" private-test-key
[[ ! -e $ROOT/previous ]]

setup_case interrupted
snapshot=$(create_backup "$OLD")
jq -n --arg old "$OLD" --arg next "$NEW" --arg backup "$snapshot" \
  '{old:$old,next:$next,backup:$backup}' >"$ROOT/update.pending"
printf 'damaged' >"$ROOT/fake-data/secrets/users.key"
printf '%s\n' "$NEW" >"$ROOT/active"
recover_pending
assert_equal "$(cat "$ROOT/current")" "$OLD"
assert_equal "$(cat "$ROOT/fake-data/secrets/users.key")" private-test-key

setup_case recovery-failure
snapshot=$(create_backup "$OLD")
jq -n --arg old "$OLD" --arg next "$NEW" --arg backup "$snapshot" \
  '{old:$old,next:$next,backup:$backup}' >"$ROOT/update.pending"
export FAIL_OLD=true
if (recover_pending); then exit 1; fi
[[ -f $ROOT/update.pending && -f $snapshot/data.tar.gz ]]

setup_case panel-restart
compose() { printf '%s\n' "$*" >>"$ROOT/actions"; }
restart_panel "$OLD" restart-panel
assert_equal "$(head -n 1 "$ROOT/actions")" "$OLD stop panel"
assert_equal "$(tail -n 1 "$ROOT/actions")" "$OLD up -d --no-build --pull never --no-deps panel"
export FAIL_OLD=true
if restart_panel "$OLD" start-panel; then printf 'Unhealthy panel accepted\n' >&2; exit 1; fi

setup_case listener
# shellcheck source=/dev/null
source "$TEST_SOURCE/server/listener.sh"
sync_listener "$OLD"
assert_equal "$(env_read PANEL_PORT)" 9443
assert_equal "$(env_read PANEL_BIND)" 0.0.0.0
assert_equal "$(env_read HYSTERIA_PUBLIC_PORT)" 61254
assert_equal "$(env_read HYSTERIA_LISTEN_PORT)" 61254
assert_equal "$(env_read PANEL_ACME_ENABLED)" true
printf 'PANEL_DOMAIN=$(touch forbidden)\n' >>"$ROOT/.env"
assert_equal "$(env_read PANEL_DOMAIN)" '$(touch forbidden)'
[[ ! -e forbidden ]]

setup_case wizard
# shellcheck source=/dev/null
source "$TEST_SOURCE/server/install/configuration/index.sh"
HY2_NONINTERACTIVE=true configure_installation
assert_equal "$(env_read PANEL_BIND)" 127.0.0.1
assert_equal "$(env_read PANEL_TLS_MODE)" http
assert_equal "$(stat -c %a "$ROOT/.env")" 600
if (HY2_NONINTERACTIVE=true HY2_DOMAIN=panel.example.com HY2_EMAIL=owner@example.com configure_installation); then exit 1; fi
HY2_NONINTERACTIVE=true HY2_DOMAIN=panel.example.com HY2_EMAIL=owner@example.com HY2_ACCEPT_ACME_TERMS=true configure_installation
assert_equal "$(env_read PANEL_TLS_MODE)" acme
HY2_NONINTERACTIVE=true HY2_DOMAIN=203.0.113.10 HY2_HTTP=true configure_installation
assert_equal "$(env_read PANEL_TLS_MODE)" http
assert_equal "$(env_read PANEL_BIND)" 0.0.0.0
assert_equal "$(env_read PANEL_PUBLIC_URL)" http://203.0.113.10:8080
assert_equal "$(env_read PANEL_ACME_ENABLED)" false
HY2_NONINTERACTIVE=true HY2_DOMAIN=2606:4700:4700::1111 HY2_EMAIL=owner@example.com HY2_ACCEPT_ACME_TERMS=true configure_installation
assert_equal "$(env_read PANEL_PUBLIC_URL)" 'https://[2606:4700:4700::1111]:9443'
if (HY2_NONINTERACTIVE=true HY2_DOMAIN='../invalid' HY2_ACCEPT_ACME_TERMS=true configure_installation); then exit 1; fi
if (HY2_INSTALL_DIR=/ source "$TEST_SOURCE/server/common.sh"); then exit 1; fi
printf 'Deployment lifecycle tests passed.\n'
bash "$TEST_SOURCE/server/backups/cloud/cloud_test.sh"
bash "$(dirname -- "${BASH_SOURCE[0]}")/transfer.sh"
bash "$(dirname -- "${BASH_SOURCE[0]}")/account/password.sh"
bash "$(dirname -- "${BASH_SOURCE[0]}")/images/run.sh"
bash "$(dirname -- "${BASH_SOURCE[0]}")/uninstall/run.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/install/index.sh"
