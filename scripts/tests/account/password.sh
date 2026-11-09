#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
TASK_ACCOUNT_ROOT=$(mktemp -d /tmp/hy2-password-test.XXXXXX)
trap '[[ $TASK_ACCOUNT_ROOT == /tmp/hy2-password-test.* ]] && rm -rf -- "$TASK_ACCOUNT_ROOT"' EXIT
source "$(dirname -- "${BASH_SOURCE[0]}")/../../server/account/password.sh"
die(){ printf '%s\n' "$*" >&2; exit 1; }
compose(){
 printf '%s\n' "$*" >>"$TASK_ACCOUNT_ROOT/events"
 if [[ $* == *--reset-admin-password ]]; then
  IFS= read -r received_password
  printf '%s' "$received_password" >"$TASK_ACCOUNT_ROOT/received"
  [[ $* != *"$received_password"* ]]
  [[ ${TASK_RESET_FAIL:-false} != true ]] || return 1
  printf '{"username":"operator","hasCloudPassword":true}\n'
 fi
}
start_release(){ printf 'start\n' >>"$TASK_ACCOUNT_ROOT/events"; [[ ${TASK_START_FAIL:-false} != true ]]; }
reset_admin_password sha >"$TASK_ACCOUNT_ROOT/output" 2>"$TASK_ACCOUNT_ROOT/errors"
recovered_password=$(sed -n 's/^Пароль: //p' "$TASK_ACCOUNT_ROOT/output")
[[ $recovered_password =~ ^[a-f0-9]{48}$ ]]
[[ $(cat "$TASK_ACCOUNT_ROOT/received") == "$recovered_password" ]]
! grep -Fq "$recovered_password" "$TASK_ACCOUNT_ROOT/events" "$TASK_ACCOUNT_ROOT/errors"
grep -q 'Логин: operator' "$TASK_ACCOUNT_ROOT/output"
grep -q 'Облачный пароль сохранён' "$TASK_ACCOUNT_ROOT/output"
TASK_RESET_FAIL=true
if (reset_admin_password sha >"$TASK_ACCOUNT_ROOT/failed-output" 2>/dev/null); then exit 1; fi
[[ ! -s $TASK_ACCOUNT_ROOT/failed-output ]]
TASK_RESET_FAIL=false TASK_START_FAIL=true
if (reset_admin_password sha >"$TASK_ACCOUNT_ROOT/start-failure" 2>/dev/null); then exit 1; fi
grep -Eq '^Пароль: [a-f0-9]{48}$' "$TASK_ACCOUNT_ROOT/start-failure"
printf 'Administrator recovery, stdin-only secrets and failure handling passed.\n'
