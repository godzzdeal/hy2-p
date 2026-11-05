#!/usr/bin/env bash
# Invoked in the isolated GitHub Actions test installation.
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$URL/api/login" >/dev/null
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 1 \
  -subj /CN=localhost -addext subjectAltName=DNS:localhost \
  -keyout "$WORK/server.key" -out "$WORK/server.crt" 2>/dev/null
sudo cp "$WORK/server.key" "$WORK/server.crt" "$ROOT/certs/"
# Disposable self-signed test fixture, readable by the non-root container.
sudo chmod 644 "$ROOT/certs/server.key" "$ROOT/certs/server.crt"
jq -n --arg config 'listen: 127.0.0.1:18443
tls:
  cert: /certs/server.crt
  key: /certs/server.key
' '{host:"127.0.0.1",port:"18443",sni:"localhost",config:$config}' >"$WORK/settings.json"
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PUT --data-binary "@$WORK/settings.json" "$URL/api/settings" >/dev/null
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$URL/api/core/start" >/dev/null
wait_core() {
core_running=false
for ((attempt=0; attempt<45; attempt++)); do
  if curl -fsS -b "$WORK/cookies" "$URL/api/core" | jq -e '.running == true and .watchdog.desiredRunning == true' >/dev/null; then
    core_running=true; break
  fi
  sleep 1
done
[[ $core_running == true ]] || {
 curl -fsS -b "$WORK/cookies" "$URL/api/core" >&2 || true
 printf "Core did not become ready.\n" >&2; return 1
 }
}
wait_core
manager restart
# Sessions intentionally expire on restart; sign in again.
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$URL/api/login" >/dev/null
wait_core


# A user created while the core is running must authenticate from the exported subscription.
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X DELETE "$URL/api/logs" | jq -e '.logs == ""' >/dev/null
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"name":"Subscription test","password":"client:@/+?#fixture-only"}' "$URL/api/users" >"$WORK/user.json"
user_id=$(jq -er '.id' "$WORK/user.json")
token=$(curl -fsS -b "$WORK/cookies" "$URL/api/users/$user_id/links" | jq -er '.subscription | split("/sub/")[1]')
uri=$(curl -fsS "$URL/sub/$token" | base64 -d)
jq -n --arg server "$uri" '{server:$server,tls:{ca:"/certs/server.crt"},socks5:{listen:"0.0.0.0:11080"}}' >"$WORK/client.json"
panel_id=$(sudo docker ps -q --filter name=hy2-panel-panel-1)
panel_ip=$(sudo docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$panel_id")
panel_image=$(sudo docker inspect --format '{{.Config.Image}}' "$panel_id")
CLIENT_CONTAINER=$(sudo docker run -d --rm --network "container:$panel_id" \
  --entrypoint /usr/local/bin/hysteria -v "$WORK/client.json:/client.json:ro" \
  -v "$ROOT/certs:/certs:ro" "$panel_image" client -c /client.json)
wait_online() {
  local expected=$1
  for ((attempt=0; attempt<30; attempt++)); do
    # Hysteria applies /kick on the next traffic event, not on idle QUIC keepalives.
    if [[ $expected == 0 ]]; then
      curl -fsS --max-time 3 --noproxy "" --socks5-hostname "$panel_ip:11080" \
        http://127.0.0.1:8081/health >/dev/null 2>&1 || true
    fi
    if curl -fsS -b "$WORK/cookies" "$URL/api/traffic" |
      jq -e --arg id "$user_id" --argjson expected "$expected" \
      '.available and ((.users[$id].online // 0) == $expected)' >/dev/null; then return 0; fi
    sleep 1
  done
  sudo docker logs "$CLIENT_CONTAINER" >&2 || true
  printf 'Client online status did not reach %s.\n' "$expected" >&2
  return 1
}
wait_online 1
# Verify an actual proxy request before disabling access.
curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$panel_ip:11080" \
  http://127.0.0.1:8081/health >/dev/null
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PATCH --data '{"name":"Subscription test","enabled":false}' "$URL/api/users/$user_id" >/dev/null
wait_online 0
sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null
CLIENT_CONTAINER=
printf 'Subscription authentication, live user creation, disconnect and log clearing passed.\n'
