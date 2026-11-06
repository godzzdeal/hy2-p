#!/usr/bin/env bash
recover_udp() {
  [[ -f $ROOT/udp.pending ]] || return 0
  local sha
  sha=$(jq -er '.commit' "$ROOT/udp.pending")
  valid_sha "$sha" || return 1
  [[ -f $ROOT/udp-environment ]] || return 1
  cp -- "$ROOT/udp-environment" "$ROOT/.env" || return 1
  chmod 600 "$ROOT/.env"
  PANEL_UDP_PROBE_TOKEN="" PANEL_UDP_PROBE_ID="" compose "$sha" up -d --no-build --pull never panel || return 1
  wait_healthy "$sha" && verify_udp_core "$sha" || return 1
  rm -f -- "$ROOT/udp.pending" "$ROOT/udp-environment"
}
