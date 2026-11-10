#!/usr/bin/env bash
for file in operations cleanup; do
  # shellcheck source=/dev/null
  source "$(dirname -- "${BASH_SOURCE[0]}")/$file.sh"
done
# Exercise a real older published panel, not a stubbed health response.
manager update v0.7.5
old_panel=$(sudo cat "$ROOT/current")
[[ $old_panel != "$GITHUB_SHA" ]] || return 1
manager update "$GITHUB_SHA"
login_panel
wait_image_archive "$old_panel"
test_image_cleanup
panel_maintenance '{"action":"rollback","restoreData":true}'
[[ $(sudo cat "$ROOT/current") == "$old_panel" ]] || return 1
manager update "$GITHUB_SHA"
login_panel
wait_image_archive "$old_panel"
panel_maintenance '{"action":"update","version":"v0.7.5"}'
[[ $(sudo cat "$ROOT/current") == "$old_panel" ]] || return 1
manager update "$GITHUB_SHA"
login_panel
wait_image_archive "$old_panel"
wait_core
printf 'Web panel update, rollback and legacy progress polling passed.\n'
