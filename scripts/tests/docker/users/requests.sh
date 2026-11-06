#!/usr/bin/env bash
user_id=${user_id:?Run the user fixture first}
panel_image=${panel_image:?Run the core fixture first}
socks_host=${socks_host:?Run the core fixture first}
token=${token:?Run the user fixture first}
user_request() {
  curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    -X "$1" --data "$3" "$URL/api/users/$user_id/$2"
}
stop_test_client() {
  if [[ -n ${CLIENT_CONTAINER:-} ]]; then sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null 2>&1 || true; fi
  CLIENT_CONTAINER=
}
start_test_client() {
  jq -n --arg server "$1" '{server:$server,tls:{ca:"/certs/server.crt"},socks5:{listen:"127.0.0.1:11080"}}' >"$WORK/client.json"
  CLIENT_CONTAINER=$(sudo docker run -d --rm --network host \
    --entrypoint /usr/local/bin/hysteria -v "$WORK/client.json:/client.json:ro" \
    -v "$ROOT/certs:/certs:ro" "$panel_image" client -c /client.json)
}
assert_proxy_denied() {
  sleep 1
  if curl -fsS --max-time 3 --noproxy "" --socks5-hostname "$socks_host:11080" \
    http://127.0.0.1:8081/health >/dev/null 2>&1; then
    printf 'Revoked connection still proxies traffic.\n' >&2; return 1
  fi
}
device_subscription() {
 curl -sS -D "$WORK/device-headers" -o "$WORK/device-subscription" -w '%{http_code}' \
   -H "x-hwid: $1" -H 'x-device-model: Integration phone' -H 'x-device-os: iOS' \
   -H 'x-ver-os: fixture' -H 'User-Agent: Happ/integration-fixture' "$URL/sub/$token"
}

