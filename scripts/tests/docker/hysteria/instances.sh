#!/usr/bin/env bash
# Two real cores, one shared user and a subscription containing both active ports.
token=${token:?Run core.sh first}
user_id=${user_id:?Run core.sh first}
panel_image=${panel_image:?Run core.sh first}
socks_host=${socks_host:?Run core.sh first}
for file in requests cores devices; do
  # shellcheck source=/dev/null
  source "$(dirname -- "${BASH_SOURCE[0]}")/../users/$file.sh"
done
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/settings" |
  jq '.port="61258" | .config |= sub("listen: :[0-9]+";"listen: :61258") | {name:"Second engine",settings:.}' >"$WORK/instance.json"
extra_id=$(curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data-binary "@$WORK/instance.json" "$URL/api/instances" | jq -er '.id')
[[ $extra_id =~ ^[a-f0-9]{16}$ ]] || return 1
extra_api=$URL/api/instances/$extra_id
curl -fsS -b "$WORK/cookies" "$extra_api/core" | jq -e '(.running | not) and (.watchdog.desiredRunning | not)' >/dev/null
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$extra_api/core/start" >/dev/null
# Wait for the second statistics listener before requesting a container recreation.
for ((attempt=0; attempt<30; attempt++)); do
  if curl -fsS -b "$WORK/cookies" "$URL/api/traffic" | jq -e '.available' >/dev/null; then break; fi
  sleep 1
done
sleep 2
ticket=$(curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"publicPort":"61258","listenPort":"61258"}' "$extra_api/deployment/udp" | jq -er '.id')
wait_operation() {
  local status
  for ((attempt=0; attempt<180; attempt++)); do
    status=$(curl -fsS --max-time 3 "$URL/api/deployment/udp/status/$1" 2>/dev/null || true)
    if [[ -n $status ]] && jq -e '.busy == false' <<<"$status" >/dev/null 2>&1; then
      jq -e '.phase == "success" and .coreChecked' <<<"$status" >/dev/null
      return
    fi
    sleep 1
  done
  printf 'Multi-core network operation timed out.\n' >&2
  return 1
}
wait_operation "$ticket"
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/instances" | jq -e 'length == 2 and all(.running)' >/dev/null
curl -fsS -b "$WORK/cookies" "$extra_api/core" | jq -e '.running and .watchdog.desiredRunning' >/dev/null
curl -fsS -b "$WORK/cookies" "$URL/api/settings" | jq -e '.port == "61256" and (.config | contains("listen: :61254"))' >/dev/null
curl -fsS "$URL/sub/$token" | base64 -d >"$WORK/multi-subscription"
[[ $(wc -l <"$WORK/multi-subscription") == 2 ]] || return 1
uri=$(curl -fsS -b "$WORK/cookies" "$URL/api/users/$user_id/links" |
  jq -er --arg id "$extra_id" '.connections[] | select(.instanceId == $id) | .uri')
[[ $uri == *:61258* ]] || return 1
panel_id=$(sudo docker ps -q --filter name=hy2-panel-panel-1)
main_process() { sudo docker top "$panel_id" -eo pid,args | awk '$NF == "/data/runtime.yaml" {print $1}'; }
main_pid=$(main_process)
[[ $main_pid =~ ^[0-9]+$ ]] || return 1
# Updating and rolling back one core must leave the other process untouched.
version=$(curl -fsS -b "$WORK/cookies" "$extra_api/core/versions" | jq -er '[.[] | select(.available)][0].tag')
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data "{\"version\":\"$version\"}" "$extra_api/core/update" >/dev/null
wait_version_operation() {
  local status
  for ((attempt=0; attempt<180; attempt++)); do
    status=$(curl -fsS -b "$WORK/cookies" "$extra_api/core/update")
    if jq -e '(.busy | not)' <<<"$status" >/dev/null; then
      jq -e '.result.phase == "success"' <<<"$status" >/dev/null
      return
    fi
    sleep 1
  done
  return 1
}
wait_version_operation
[[ $(main_process) == "$main_pid" ]] || return 1
curl -fsS -b "$WORK/cookies" "$extra_api/core/update" | jq -e --arg version "$version" '.current == $version and .rollbackAvailable' >/dev/null
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$extra_api/core/rollback" >/dev/null
wait_version_operation
[[ $(main_process) == "$main_pid" ]] || return 1
# Kill only the disposable second core; its watchdog should restore it without restarting the first.
sudo docker exec "$panel_id" pkill -9 -f "^.*server -c /data/instances/$extra_id/runtime.yaml$"
watchdog_ready=false
for ((attempt=0; attempt<45; attempt++)); do
  if curl -fsS -b "$WORK/cookies" "$extra_api/core" | jq -e '.running and .watchdog.attempt > 0 and .watchdog.state == "watching"' >/dev/null; then
    watchdog_ready=true; break
  fi
  sleep 1
done
[[ $watchdog_ready == true && $(main_process) == "$main_pid" ]] || return 1
jq -n --arg server "$uri" '{server:$server,tls:{ca:"/certs/server.crt"},socks5:{listen:"127.0.0.1:11080"}}' >"$WORK/client.json"
CLIENT_CONTAINER=$(sudo docker run -d --rm --network host \
  --entrypoint /usr/local/bin/hysteria -v "$WORK/client.json:/client.json:ro" \
  -v "$ROOT/certs:/certs:ro" "$panel_image" client -c /client.json)
wait_online 1
curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$socks_host:11080" http://127.0.0.1:8081/health >/dev/null
test_core_access
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PATCH --data '{"name":"Subscription test","enabled":false}' "$URL/api/users/$user_id" >/dev/null
wait_online 0
sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null
CLIENT_CONTAINER=
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PATCH --data '{"name":"Subscription test","enabled":true}' "$URL/api/users/$user_id" >/dev/null
test_device_limit
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$extra_api/core/stop" >/dev/null
ticket=$(curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X DELETE "$extra_api" | jq -er '.operation.id')
wait_operation "$ticket"
login_panel
# Listing finalizes durable deletion after the helper confirms port removal.
curl -fsS -b "$WORK/cookies" "$URL/api/instances" | jq -e 'length == 1 and .[0].id == "default" and .[0].running' >/dev/null
curl -fsS "$URL/sub/$token" | base64 -d >"$WORK/single-subscription"
[[ $(wc -l <"$WORK/single-subscription") == 1 ]] || return 1
panel_id=$(sudo docker ps -q --filter name=hy2-panel-panel-1)
sudo docker inspect "$panel_id" | jq -e '(.[0].HostConfig.PortBindings | has("61258/udp") | not)' >/dev/null
printf 'Two isolated cores, shared subscription, live proxy, shared access and safe removal passed.\n'
