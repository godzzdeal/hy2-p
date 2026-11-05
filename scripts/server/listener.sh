#!/usr/bin/env bash
sync_listener() {
  local sha=$1 settings port mode challenge
  check_volume
  settings=$(engine run --rm --network none --read-only -v "$VOLUME:/data:ro" \
    --entrypoint sh "$(image_for "$sha")" -c '
      latest=""
      for file in /data/web/web-*.json; do [ ! -f "$file" ] || latest=$file; done
      if [ -n "$latest" ]; then cat "$latest"; else printf "{}"; fi
    ' | jq '{port,mode,challengePort,publicURL}')
  port=$(jq -r '.port // empty' <<<"$settings")
  [[ -n $port ]] || return 0
  [[ $port =~ ^[0-9]+$ && $port -ge 1 && $port -le 65535 ]] || die "Некорректный сохранённый порт."
  mode=$(jq -r '.mode' <<<"$settings")
  env_set PANEL_PORT "$port"
  local public_url
  public_url=$(jq -r '.publicURL // empty' <<<"$settings")
  if [[ -n $public_url ]]; then env_set PANEL_PUBLIC_URL "$public_url"; fi
  if [[ $mode == acme ]]; then
    challenge=$(jq -r '.challengePort' <<<"$settings")
    [[ $challenge =~ ^[0-9]+$ ]] || die "Некорректный порт ACME."
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
