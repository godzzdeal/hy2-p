#!/usr/bin/env bash
# Poll the public ticket endpoint, including after replacement by the older helper.
panel_maintenance() {
  local input=$1 operation ticket attempt
  operation=$(curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    --data "$input" "$URL/api/panel/maintenance")
  ticket=$(jq -er '.id' <<<"$operation")
  [[ $ticket =~ ^[a-f0-9]{32}$ ]] || return 1
  for ((attempt=0; attempt<180; attempt++)); do
    if operation=$(curl -fsS --max-time 5 "$URL/api/deployment/udp/status/$ticket" 2>/dev/null) &&
      jq -e '.busy == false' <<<"$operation" >/dev/null; then
      jq -e '.phase == "success"' <<<"$operation" >/dev/null || { printf '%s\n' "$operation" >&2; return 1; }
      return 0
    fi
    sleep 1
  done
  printf 'Panel maintenance did not finish.\n' >&2
  return 1
}
