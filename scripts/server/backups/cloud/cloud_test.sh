#!/usr/bin/env bash
set -Eeuo pipefail
WORK=$(mktemp -d /tmp/hy2-cloud-test.XXXXXXXX)
trap 'rm -rf -- "$WORK"' EXIT
ROOT=$WORK/install
mkdir -p "$ROOT/cloud-backup" "$ROOT/backups"
source "$(dirname -- "${BASH_SOURCE[0]}")/index.sh"
log() { printf '%s\n' "$*"; }
die() { printf '%s\n' "$*" >&2; exit 1; }
backup_panel() {
 export LAST_BACKUP=$ROOT/backups/local
 mkdir -p "$LAST_BACKUP"
 printf '{"format":1}\n' >"$LAST_BACKUP/manifest.json"
 printf 'local-copy' >"$LAST_BACKUP/data.tar.gz"
}
FAIL_UPLOAD=false
engine() {
 printf '%s\n' "$*" >>"$ROOT/events"
 if [[ $1 == run && $* == *' copyto '* && $FAIL_UPLOAD == true ]]; then return 1; fi
}
jq -n '{destination:"disk:HY2-P",configText:"[disk]\ntype=yandex\ntoken=PRIVATE"}' >"$ROOT/cloud-backup/settings-00000000000000000001.json"
cloud_backup abc
[[ -f $ROOT/backups/local/data.tar.gz ]]
grep -q 'copyto /transfer/files/hy2-p-.*-backup.tar.gz disk:HY2-P/' "$ROOT/events"
grep -q 'check /transfer/files disk:HY2-P --one-way --download' "$ROOT/events"
[[ $(find "$ROOT/backups" -name '.cloud-*' | wc -l) == 0 ]]
FAIL_UPLOAD=true
if cloud_backup abc; then printf 'Upload failure ignored\n' >&2; exit 1; fi
[[ -f $ROOT/backups/local/data.tar.gz ]]
printf 'Cloud backup upload, verification, failure preservation and cleanup passed.\n'
