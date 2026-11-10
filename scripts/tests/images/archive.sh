#!/usr/bin/env bash
setup_images archive
archive_image "$OLD"
verify_image_archive "$OLD"
has_image "$OLD"
image_state "$OLD" false
restore_image "$OLD"
has_image "$OLD"

setup_images export-failure
export SAVE_FAIL=true
if archive_image "$OLD"; then printf 'Failed export accepted\n' >&2; exit 1; fi
has_image "$OLD"
[[ ! -e $ROOT/image-archives/$OLD ]]

setup_images corrupt-archive
archive_image "$OLD"
printf broken >>"$ROOT/image-archives/$OLD/image.tar.gz"
if cleanup_images "$NEW"; then printf 'Corrupt archive accepted\n' >&2; exit 1; fi
has_image "$OLD"
has_image "$NEW"
image_state "$OLD" false
printf '%s\n' "$ROOT/backups/original" >"$ROOT/rollback-backup"
if rollback_panel "$NEW" --yes; then printf 'Corrupt rollback accepted\n' >&2; exit 1; fi
[[ ! -e $ROOT/events ]]

setup_images rollback
archive_image "$OLD"
image_state "$OLD" false
printf '%s\n' "$ROOT/backups/original" >"$ROOT/rollback-backup"
compose() { printf 'stop %s\n' "$1" >>"$ROOT/events"; }
create_backup() { printf '%s\n' "$ROOT/backups/safety"; }
restore_backup() { has_image "$2"; }
start_release() { has_image "$1"; }
rollback_panel "$NEW" --yes
[[ $(cat "$ROOT/current") == "$OLD" ]]
[[ $(head -n 1 "$ROOT/events") == "load $OLD" ]]
[[ $(sed -n '2p' "$ROOT/events") == "stop $NEW" ]]
printf 'Archive export, checksum, offline restore and rollback ordering passed.\n'
