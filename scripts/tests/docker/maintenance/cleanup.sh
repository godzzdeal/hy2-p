#!/usr/bin/env bash
test_image_cleanup() {
  local current previous stale
  current=$(sudo cat "$ROOT/current")
  previous=$(sudo cat "$ROOT/previous")
  stale=0000000000000000000000000000000000000000
  [[ $current != "$previous" && $current != "$stale" && $previous != "$stale" ]] || return 1
  sudo mkdir -p "$ROOT/releases/$stale"
  printf 'FROM scratch\nLABEL io.hy2-panel.commit=%s\n' "$stale" | sudo docker build -q -t "hy2-panel:$stale" -
  curl -fsS -b "$WORK/cookies" "$URL/api/panel/maintenance" | jq -e '.rollbackAvailable' >/dev/null
  panel_maintenance '{"action":"cleanup"}'
  if sudo docker image inspect "hy2-panel:$stale" >/dev/null 2>&1; then
    printf 'Unused old image was not removed.\n' >&2; return 1
  fi
  sudo docker image inspect "hy2-panel:$current" "hy2-panel:$previous" >/dev/null
  curl -fsS -b "$WORK/cookies" "$URL/api/session" | jq -e '.ok' >/dev/null
  curl -fsS -b "$WORK/cookies" "$URL/api/system" | jq -e '.storage.imageCount == 2' >/dev/null
  printf 'Web image cleanup preserved the active image, rollback and session.\n'
}
