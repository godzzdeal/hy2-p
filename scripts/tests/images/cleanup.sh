#!/usr/bin/env bash
setup_images cleanup
hash=$(printf '%s' "$ROOT" | sha256sum); hash=${hash%% *}
add_container aaaaaaaaaaaa "$OLD" exited io.hy2-panel.maintenance "$hash"
add_container bbbbbbbbbbbb "$STALE" exited io.hy2-panel.install-dir "$ROOT"
add_container cccccccccccc "$NEW" running io.hy2-panel.install-dir "$ROOT"
add_container dddddddddddd "$FOREIGN" exited io.hy2-panel.install-dir /other-installation
mkdir -p "$ROOT/image-archives/$STALE"
cleanup_images "$NEW"
has_image "$NEW"
has_image "$FOREIGN"
! has_image "$OLD"
! has_image "$STALE"
verify_image_archive "$OLD"
[[ $(jq length "$ROOT/containers.json") == 2 ]]
[[ ! -e $ROOT/image-archives/$STALE ]]
[[ $(cat "$ROOT/images-maintained") == "$NEW:$OLD" ]]
grep -q 'saved diagnostic' "$ROOT/last-maintenance.log"
restore_image "$OLD"
has_image "$OLD"

setup_images in-use
add_container aaaaaaaaaaaa "$OLD" running io.hy2-panel.install-dir /another-installation
cleanup_images "$NEW"
has_image "$OLD"
has_image "$NEW"
verify_image_archive "$OLD"
[[ ! -e $ROOT/images-maintained ]]

setup_images interrupted
touch "$ROOT/update.pending"
if (cleanup_images "$NEW"); then printf 'Pending update ignored\n' >&2; exit 1; fi
has_image "$OLD"
has_image "$NEW"

setup_images no-rollback
rm "$ROOT/previous"
cleanup_images "$NEW"
has_image "$NEW"
has_image "$FOREIGN"
! has_image "$OLD"
printf 'Scoped container/image cleanup, active/foreign protection and archive retention passed.\n'
