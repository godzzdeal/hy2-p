#!/usr/bin/env bash
sync_listener() {
  local sha=$1 settings port mode challenge identifier metadata core_http udp_public udp_listen
  check_volume
  settings=$(engine run --rm --network none --read-only -v "$VOLUME:/data:ro" \
    --entrypoint sh "$(image_for "$sha")" -c '
      latest=""
      for file in /data/web/web-*.json; do [ ! -f "$file" ] || latest=$file; done
      if [ -n "$latest" ]; then cat "$latest"; else printf "{}"; fi
    ' | jq '{port,mode,challengePort,publicURL}')
  port=$(jq -r '.port // empty' <<<"$settings")
  if [[ -n $port ]]; then
    [[ $port =~ ^[1-9][0-9]*$ && $port -le 65535 ]] || die "Некорректный сохранённый порт."
    env_set PANEL_PORT "$port"
  fi
  local public_url
  public_url=$(jq -r '.publicURL // empty' <<<"$settings")
  if [[ -n $public_url ]]; then env_set PANEL_PUBLIC_URL "$public_url"; fi
  mode=$(jq -r '.mode // empty' <<<"$settings")
  mode=${mode:-$(env_read PANEL_TLS_MODE)}
  core_http=$(env_read PANEL_CORE_ACME_HTTP)
  core_http=${core_http:-false}
  identifier=$(compose "$sha" ps -q panel)
  # Older or stopped panels may not expose deployment metadata yet.
  if [[ -n $identifier ]] && metadata=$(engine exec "$identifier" wget -T 5 -q -O - http://127.0.0.1:8081/deployment 2>/dev/null); then
    core_http=$(jq -er '.httpChallenge | tostring' <<<"$metadata")
    [[ $core_http == true || $core_http == false ]] || die "Некорректные параметры ACME ядра."
    env_set PANEL_CORE_ACME_HTTP "$core_http"
    udp_public=$(jq -r '.udpPublicPort // empty' <<<"$metadata")
    udp_listen=$(jq -r '.udpListenPort // empty' <<<"$metadata")
    if [[ -n $udp_public && -n $udp_listen ]]; then
      [[ $udp_public =~ ^[1-9][0-9]{0,4}$ && $udp_public -le 65535 ]] || die "Некорректный публичный UDP-порт."
      [[ $udp_listen =~ ^[1-9][0-9]{0,4}$ && $udp_listen -le 65535 ]] || die "Некорректный UDP-порт ядра."
      env_set HYSTERIA_PUBLIC_PORT "$udp_public"
      env_set HYSTERIA_LISTEN_PORT "$udp_listen"
    fi
  fi
  if [[ $mode == acme || $core_http == true ]]; then
    challenge=$(jq -r '.challengePort // empty' <<<"$settings")
    challenge=${challenge:-$(env_read PANEL_ACME_PORT)}
    challenge=${challenge:-9080}
    [[ $challenge =~ ^[1-9][0-9]*$ && $challenge -le 65535 && $challenge != 9090 ]] || die "Некорректный порт ACME."
    env_set PANEL_ACME_ENABLED true
    env_set PANEL_ACME_PORT "$challenge"
  else
    env_set PANEL_ACME_ENABLED false
  fi
}
show_access() {
  local port bind address
  port=$(env_read PANEL_PORT); bind=$(env_read PANEL_BIND); address=$(env_read PANEL_PUBLIC_URL)
  if [[ $bind == 127.0.0.1 ]]; then
    log "Доступ через SSH: ssh -N -L 18080:127.0.0.1:$port USER@SERVER_IP"
    log "Откройте http://127.0.0.1:18080"
  else
    log "Публичный адрес: $address"
  fi
}
