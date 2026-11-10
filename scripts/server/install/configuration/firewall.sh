#!/usr/bin/env bash
open_install_ports() {
  [[ ${HY2_OPEN_PORTS:-false} == true ]] || return 0
  if ! command -v ufw >/dev/null; then
    log "UFW не установлен. Проверьте правила firewall хостинга; установщик их не изменяет."
    return 0
  fi
  local panel udp
  panel=$(env_read PANEL_PORT); udp=$(env_read HYSTERIA_PUBLIC_PORT); udp=${udp:-8443}
  [[ $panel =~ ^[1-9][0-9]{0,4}$ && $panel -le 65535 && $udp =~ ^[1-9][0-9]{0,4}$ && $udp -le 65535 ]] || return 1
  ufw allow "$panel/tcp" comment 'HY2-P panel' || return 1
  ufw allow "$udp/udp" comment 'HY2-P Hysteria2' || return 1
  if [[ $(env_read PANEL_ACME_ENABLED) == true ]]; then ufw allow 80/tcp comment 'HY2-P ACME' || return 1; fi
  log "Правила UFW добавлены: TCP $panel, UDP $udp и TCP 80, если используется HTTP ACME."
  if ! LC_ALL=C ufw status | grep -q '^Status: active'; then log "UFW выключен и не был включён. Правила сохранены на случай его включения."
  fi
  log "Firewall хостинга настраивается отдельно."
}
