#!/usr/bin/env bash
# Invoked in the isolated GitHub Actions test installation.
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$URL/api/login" >/dev/null
# The real public router must resolve this endpoint even without the optional host helper.
firewall_status=$(curl -sS -b "$WORK/cookies" -o "$WORK/firewall-response.json" -w '%{http_code}' "$URL/api/firewall")
[[ $firewall_status == 503 ]] || { printf 'Unexpected firewall API status: %s\n' "$firewall_status" >&2; return 1; }
jq -e '.error | contains("firewall-setup")' "$WORK/firewall-response.json" >/dev/null
firewall_invalid=$(curl -sS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X POST --data '{"port":0,"protocol":"tcp","action":"allow"}' -o "$WORK/firewall-invalid.json" -w '%{http_code}' "$URL/api/firewall")
[[ $firewall_invalid == 400 ]] || return 1
jq -e '.error | length > 0' "$WORK/firewall-invalid.json" >/dev/null
firewall_unauthorized=$(curl -sS -o /dev/null -w '%{http_code}' "$URL/api/firewall")
[[ $firewall_unauthorized == 401 ]] || return 1
curl -fsS -b "$WORK/cookies" "$URL/api/firewall/ports" | jq -e '.ports | any(.purpose == "panel" and .protocol == "tcp")' >/dev/null
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 1 \
  -subj /CN=localhost -addext subjectAltName=DNS:localhost \
  -keyout "$WORK/server.key" -out "$WORK/server.crt" 2>/dev/null
# Check the actual bundled Hysteria ECH CLI; generated material stays in the disposable volume.
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"publicName":"public.example.com"}' "$URL/api/tools/ech" >"$WORK/ech.json"
jq -e '(.keyPath | startswith("/data/ech/")) and (.configList | length > 8) and (has("privateKey") | not)' "$WORK/ech.json" >/dev/null
curl -fsS -b "$WORK/cookies" "$URL/api/tools/traffic-stats" |
  jq -e '.listen == "127.0.0.1:9999" and (.secret | length >= 32)' >/dev/null
sudo cp "$WORK/server.key" "$WORK/server.crt" "$ROOT/certs/"
# Disposable self-signed test fixture, readable by the non-root container.
sudo chmod 644 "$ROOT/certs/server.key" "$ROOT/certs/server.crt"
jq -n --arg config 'listen: :61254
tls:
  cert: /certs/server.crt
  key: /certs/server.key
' '{host:"127.0.0.1",port:"61255",sni:"localhost",config:$config}' >"$WORK/settings.json"
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
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PUT --data '{"profileTitle":"🇩🇪 Германия","enabled":false,"text":"","updateInterval":6}' "$URL/api/admin/announcement" >/dev/null
uri=$(curl -fsS -D "$WORK/subscription.headers" "$URL/sub/$token" | base64 -d)
expected_title=$(printf '🇩🇪 Германия' | base64 -w0)
tr -d '\r' <"$WORK/subscription.headers" | grep -qi "^profile-title: base64:$expected_title$"
jq -n --arg server "$uri" '{server:$server,tls:{ca:"/certs/server.crt"},socks5:{listen:"127.0.0.1:11080"}}' >"$WORK/client.json"
panel_id=$(sudo docker ps -q --filter name=hy2-panel-panel-1)
socks_host=127.0.0.1
sudo docker inspect "$panel_id" | jq -e '.[0].HostConfig.PortBindings["61254/udp"][0].HostPort == "61255" and (.[0].HostConfig.PortBindings | has("8443/udp") | not)' >/dev/null
panel_image=$(sudo docker inspect --format '{{.Config.Image}}' "$panel_id")
CLIENT_CONTAINER=$(sudo docker run -d --rm --network host \
  --entrypoint /usr/local/bin/hysteria -v "$WORK/client.json:/client.json:ro" \
  -v "$ROOT/certs:/certs:ro" "$panel_image" client -c /client.json)
wait_online() {
  local expected=$1
  for ((attempt=0; attempt<30; attempt++)); do
    # Hysteria applies /kick on the next traffic event, not on idle QUIC keepalives.
    if [[ $expected == 0 ]]; then
      curl -fsS --max-time 3 --noproxy "" --socks5-hostname "$socks_host:11080" \
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
curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$socks_host:11080" \
  http://127.0.0.1:8081/health >/dev/null
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PATCH --data '{"name":"Subscription test","enabled":false}' "$URL/api/users/$user_id" >/dev/null
wait_online 0
sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null
CLIENT_CONTAINER=
printf 'Subscription authentication, live user creation, disconnect and log clearing passed.\n'
