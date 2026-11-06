#!/usr/bin/env bash
apply_udp() {
  local sha=$1 ticket=$2 public=$3 target=$4 identifier metadata
  [[ $ticket =~ ^[a-f0-9]{32}$ ]] || return 1
  [[ $public =~ ^[1-9][0-9]{0,4}$ && $public -le 65535 ]] || return 1
  [[ $target =~ ^[1-9][0-9]{0,4}$ && $target -le 65535 ]] || return 1
  [[ ${PANEL_UDP_PROBE_TOKEN:-} =~ ^[a-f0-9]{32}$ && ${PANEL_UDP_PROBE_ID:-} == "$ticket" ]] || return 1
  identifier=$(compose "$sha" ps -q panel)
  [[ -n $identifier ]] || return 1
  metadata=$(engine exec "$identifier" wget -T 5 -q -O - http://127.0.0.1:8081/deployment) || return 1
  jq -e --arg public "$public" --arg target "$target" \
    '.udpPublicPort == $public and .udpListenPort == $target and .udpWarning == ""' <<<"$metadata" >/dev/null || return 1
  verify_udp_core "$sha" || return 1
  cp -- "$ROOT/.env" "$ROOT/udp-environment" || return 1
  chmod 600 "$ROOT/udp-environment"
  jq -n --arg commit "$sha" --arg id "$ticket" '{commit:$commit,id:$id}' >"$ROOT/.udp.pending"
  mv -- "$ROOT/.udp.pending" "$ROOT/udp.pending" || return 1
  env_set HYSTERIA_PUBLIC_PORT "$public"
  env_set HYSTERIA_LISTEN_PORT "$target"
  if compose "$sha" up -d --no-build --pull never panel &&
    /usr/local/bin/port-agent probe "$public" &&
    wait_healthy "$sha" &&
    verify_udp_ports "$sha" "$public" "$target" &&
    verify_udp_core "$sha"; then
    printf '%s\n' "$ticket" >"$ROOT/.udp-completed"
    mv -- "$ROOT/.udp-completed" "$ROOT/udp-completed"
    rm -f -- "$ROOT/udp.pending" "$ROOT/udp-environment"
    return 0
  fi
  if recover_udp; then return 10; else return 11; fi
}
