#!/usr/bin/env bash
apply_udp() {
  local sha=$1 ticket=$2 public=$3 target=$4 instance=${5:-default} metadata
  [[ $ticket =~ ^[a-f0-9]{32}$ && $instance =~ ^(default|[a-f0-9]{16})$ ]] || return 1
  [[ $public =~ ^[1-9][0-9]{0,4}$ && $public -le 65535 ]] || return 1
  [[ $target =~ ^[1-9][0-9]{0,4}$ && $target -le 65535 ]] || return 1
  [[ ${PANEL_UDP_PROBE_TOKEN:-} =~ ^[a-f0-9]{32}$ && ${PANEL_UDP_PROBE_ID:-} == "$ticket" ]] || return 1
  metadata=$(udp_metadata "$sha" "$instance") || return 1
  jq -e --arg public "$public" --arg target "$target" --arg id "$instance" \
    '.udpPublicPort == $public and .udpListenPort == $target and .udpWarning == "" and .instanceId == $id and (.removing | not)' <<<"$metadata" >/dev/null || return 1
  verify_udp_core "$sha" || return 1
  begin_udp "$sha" "$ticket" || return 1
  local prepared=false
  if [[ $instance == default ]]; then
    if env_set HYSTERIA_PUBLIC_PORT "$public" && env_set HYSTERIA_LISTEN_PORT "$target"; then prepared=true; fi
  elif save_extra_udp "$instance" "$public" "$target"; then prepared=true; fi
  if [[ $prepared == true ]] &&
    compose "$sha" up -d --no-build --pull never panel &&
    /usr/local/bin/port-agent probe "$public" &&
    wait_healthy "$sha" &&
    verify_udp_ports "$sha" "$public" "$target" &&
    verify_udp_core "$sha" && complete_udp "$ticket"; then return 0; fi
  if recover_udp; then return 10; else return 11; fi
}
remove_udp() {
  local sha=$1 ticket=$2 public=$3 target=$4 instance=$5 metadata
  [[ $ticket =~ ^[a-f0-9]{32}$ && $instance =~ ^[a-f0-9]{16}$ ]] || return 1
  [[ $public =~ ^[1-9][0-9]{0,4}$ && $public -le 65535 ]] || return 1
  [[ $target =~ ^[1-9][0-9]{0,4}$ && $target -le 65535 ]] || return 1
  metadata=$(udp_metadata "$sha" "$instance") || return 1
  jq -e --arg public "$public" --arg target "$target" \
    '.publishedUdpPort == $public and .publishedUdpListenPort == $target and .removing and (.running | not)' <<<"$metadata" >/dev/null || return 1
  begin_udp "$sha" "$ticket" || return 1
  if save_extra_udp "$instance" "$public" "$target" true &&
    compose "$sha" up -d --no-build --pull never panel &&
    wait_healthy "$sha" && verify_udp_absent "$sha" "$public" "$target" &&
    verify_udp_core "$sha" && complete_udp "$ticket"; then return 0; fi
  if recover_udp; then return 10; else return 11; fi
}
