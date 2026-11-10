#!/usr/bin/env bash
test_install_firewall() (
  setup_case firewall-install
  source "$TEST_SOURCE/server/install/configuration/index.sh"
  ufw() { if [[ $1 == status ]]; then printf 'Status: inactive\n'; else printf '%s\n' "$*" >>"$ROOT/ufw-events"; fi; }
  HY2_OPEN_PORTS=false open_install_ports
  [[ ! -e $ROOT/ufw-events ]]
  env_set PANEL_PORT 9443; env_set PANEL_ACME_ENABLED true
  HY2_OPEN_PORTS=true open_install_ports
  grep -q '^allow 9443/tcp ' "$ROOT/ufw-events"
  grep -q '^allow 8443/udp ' "$ROOT/ufw-events"
  grep -q '^allow 80/tcp ' "$ROOT/ufw-events"
  [[ $(wc -l <"$ROOT/ufw-events") == 3 ]]
  ! grep -qE 'enable|delete|reset' "$ROOT/ufw-events"
)
test_install_firewall
