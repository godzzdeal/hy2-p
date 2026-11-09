#!/usr/bin/env bash
set -Eeuo pipefail
TASK_ROOT=$(mktemp -d /tmp/hy2-transfer-test.XXXXXX)
trap '[[ $TASK_ROOT == /tmp/hy2-transfer-test.* ]] && rm -rf -- "$TASK_ROOT"' EXIT
source "$(dirname -- "${BASH_SOURCE[0]}")/../server/transfer.sh"
die() { printf '%s\n' "$*" >&2; exit 1; }
log() { printf '%s\n' "$*" >&2; }
compose() {
  printf '%s\n' "$@" >"$TASK_ROOT/arguments"
  if [[ ${TASK_FAIL:-false} == true ]]; then return 1; fi
  printf '{"format":"hy2-p/1","rows":[]}\n'
}
transfer_panel sha export "$TASK_ROOT/export file.json"
[[ $(stat -c '%a' "$TASK_ROOT/export file.json") == 600 ]]
if (transfer_panel sha export "$TASK_ROOT/export file.json"); then exit 1; fi
ln -s "$TASK_ROOT/export file.json" "$TASK_ROOT/link.json"
if (transfer_panel sha export "$TASK_ROOT/link.json"); then exit 1; fi
TASK_FAIL=true
if (transfer_panel sha export "$TASK_ROOT/failure.json"); then exit 1; fi
[[ ! -e $TASK_ROOT/failure.json ]]
TASK_FAIL=false
transfer_panel sha import "$TASK_ROOT/export file.json" --map-core default=default >"$TASK_ROOT/preview.json"
grep -qx preview "$TASK_ROOT/arguments"
grep -qx default=default "$TASK_ROOT/arguments"
transfer_panel sha import "$TASK_ROOT/export file.json" --apply >"$TASK_ROOT/result.json"
grep -qx apply "$TASK_ROOT/arguments"
if (transfer_panel sha import "$TASK_ROOT/export file.json" --map-core); then exit 1; fi
printf 'Transfer CLI export permissions, overwrite protection and preview/apply checks passed.\n'
