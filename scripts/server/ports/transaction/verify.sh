#!/usr/bin/env bash
verify_udp_ports() {
  local sha=$1 public=$2 target=$3 identifier
  identifier=$(compose "$sha" ps -q panel)
  [[ -n $identifier ]] || return 1
  engine inspect "$identifier" | jq -e --arg public "$public" --arg key "$target/udp" \
    '.[0].HostConfig.PortBindings[$key] | any(.HostPort == $public)' >/dev/null || return 1
}
verify_udp_core() {
  local identifier
  identifier=$(compose "$1" ps -q panel)
  [[ -n $identifier ]] || return 1
  engine exec "$identifier" /usr/local/bin/port-agent check-core
}

verify_udp_absent() {
 local identifier
 identifier=$(compose "$1" ps -q panel)
 engine inspect "$identifier" | jq -e --arg public "$2" --arg key "$3/udp" \
 '[.[0].HostConfig.PortBindings[$key][]? | select(.HostPort == $public)] | length == 0' >/dev/null
}
