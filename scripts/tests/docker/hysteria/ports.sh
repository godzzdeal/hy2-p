#!/usr/bin/env bash
# Real Docker checks: successful publication, occupied host port, then working proxy after rollback.
user_id=${user_id:?Run core.sh first}
token=${token:?Run core.sh first}
panel_image=${panel_image:?Run core.sh first}
socks_host=${socks_host:?Run core.sh first}
login_panel() {
  curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    --data '{"username":"admin","password":"integration-test-password-only"}' "$URL/api/login" >/dev/null
}
save_port() {
  curl -fsS -b "$WORK/cookies" "$URL/api/settings" |
    jq --arg port "$1" '.port = $port' >"$WORK/port-settings.json"
  curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    -X PUT --data-binary "@$WORK/port-settings.json" "$URL/api/settings" >/dev/null
}
apply_port() {
  local ticket status
  ticket=$(curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    --data "{\"publicPort\":\"$1\",\"listenPort\":\"61254\"}" "$URL/api/deployment/udp" | jq -er '.id')
  [[ $ticket =~ ^[a-f0-9]{32}$ ]] || return 1
  for ((attempt=0; attempt<180; attempt++)); do
    # The old login expires on recreation. This opaque progress ticket is deliberately read-only.
    status=$(curl -fsS --max-time 3 "$URL/api/deployment/udp/status/$ticket" 2>/dev/null || true)
    if [[ -n $status ]] && jq -e --arg ticket "$ticket" '.id == $ticket and .busy == false' <<<"$status" >/dev/null 2>&1; then
      printf '%s\n' "$status" >"$WORK/port-result.json"
      return 0
    fi
    sleep 1
  done
  printf 'UDP deployment did not finish.\n' >&2
  return 1
}
login_panel
save_port 61256
apply_port 61256
jq -e '.phase == "success" and .udpChecked and .coreChecked' "$WORK/port-result.json" >/dev/null
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/deployment" |
  jq -e '.publishedUdpPort == "61256" and .publishedUdpListenPort == "61254" and (.udpRestartRequired | not)' >/dev/null
# Occupy only the disposable test port. Its PID is tracked by the parent cleanup trap.
"$WORK/net-fixture" udp 0.0.0.0:61257 "$WORK/udp-ready" &
BLOCKER=$!
for ((attempt=0; attempt<30; attempt++)); do [[ -f $WORK/udp-ready ]] && break; sleep 0.1; done
[[ -f $WORK/udp-ready ]] || return 1
save_port 61257
apply_port 61257
jq -e '.phase == "rolled_back" and (.udpChecked | not)' "$WORK/port-result.json" >/dev/null
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/deployment" |
  jq -e '.publishedUdpPort == "61256" and .udpPublicPort == "61257" and .udpRestartRequired' >/dev/null
kill "$BLOCKER"; wait "$BLOCKER" 2>/dev/null || true
BLOCKER=
# Saved desired port remains 61257, but links must use restored active port 61256.
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PATCH --data '{"name":"Subscription test","enabled":true}' "$URL/api/users/$user_id" >/dev/null
uri=$(curl -fsS "$URL/sub/$token" | base64 -d)
[[ $uri == *:61256* ]] || { printf 'Subscription advertises an unapplied port.\n' >&2; return 1; }
jq -n --arg server "$uri" '{server:$server,tls:{ca:"/certs/server.crt"},socks5:{listen:"127.0.0.1:11080"}}' >"$WORK/client.json"
CLIENT_CONTAINER=$(sudo docker run -d --rm --network host \
  --entrypoint /usr/local/bin/hysteria -v "$WORK/client.json:/client.json:ro" \
  -v "$ROOT/certs:/certs:ro" "$panel_image" client -c /client.json)
wait_online 1
curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$socks_host:11080" http://127.0.0.1:8081/health >/dev/null
sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null
CLIENT_CONTAINER=
# Do not let later manager operations retry the intentionally occupied target.
save_port 61256
printf 'UDP application, occupied-port rollback and proxy traffic after rollback passed.\n'
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$URL/api/core/stop" >/dev/null
save_port 61257
apply_port 61257
jq -e '.phase == "success" and .udpChecked' "$WORK/port-result.json" >/dev/null
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/core" | jq -e '(.running | not) and (.watchdog.desiredRunning | not)' >/dev/null
save_port 61256
apply_port 61256
login_panel
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$URL/api/core/start" >/dev/null
wait_core
printf 'Stopped cores publish UDP ports without being started.\n'
