#!/usr/bin/env bash
cleanup_containers() {
  local current=$1 identifiers identifier metadata image sha installation maintenance status label
  label=$(printf '%s' "$ROOT" | sha256sum); label=${label%% *}
  identifiers=$(engine ps -aq --filter status=exited --filter status=dead) || return 1
  for identifier in $identifiers; do
    [[ $identifier =~ ^[a-f0-9]{12,64}$ ]] || continue
    metadata=$(engine inspect "$identifier") || continue
    image=$(jq -er '.[0].Image' <<<"$metadata") || return 1
    status=$(jq -er '.[0].State.Status' <<<"$metadata") || return 1
    [[ $status == exited || $status == dead ]] || continue
    installation=$(jq -r '.[0].Config.Labels["io.hy2-panel.install-dir"] // ""' <<<"$metadata")
    maintenance=$(jq -r '.[0].Config.Labels["io.hy2-panel.maintenance"] // ""' <<<"$metadata")
    if [[ $maintenance == "$label" ]]; then
      engine logs --tail 150 "$identifier" >"$ROOT/last-maintenance.log" 2>&1 || true
    elif [[ $installation == "$ROOT" ]]; then
      sha=$(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$image") || continue
      valid_sha "$sha" && [[ $sha != "$current" && -d $ROOT/releases/$sha ]] || continue
    else continue; fi
    # No --force or --volumes: a container restarted concurrently is protected.
    engine container rm "$identifier" || return 1
  done
}
