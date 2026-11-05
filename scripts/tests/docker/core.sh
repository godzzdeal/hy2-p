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
jq -n --arg config 'listen: 127.0.0.1:0
tls:
  cert: /certs/server.crt
  key: /certs/server.key
' '{host:"localhost",port:"8443",sni:"localhost",config:$config}' >"$WORK/settings.json"
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
