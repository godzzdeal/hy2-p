#!/usr/bin/env bash
test_acme_gateway() {
  # Engine stays stopped: no public CA orders are submitted by this test.
  curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$URL/api/core/stop" >/dev/null
  jq -n --arg config 'listen: 127.0.0.1:0
acme:
  domains: [core.invalid]
  email: test@example.invalid
  type: http
' '{host:"core.invalid",port:"8443",config:$config}' >"$WORK/acme.json"
  curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
    -X PUT --data-binary "@$WORK/acme.json" "$URL/api/settings" >/dev/null
  manager restart
  local identifier proof backend_name status
  identifier=$(sudo docker ps -q --filter label=com.docker.compose.project=hy2-panel --filter label=com.docker.compose.service=panel)
  backend_name=hy2-acme-test-$GITHUB_RUN_ID
  mkdir -p "$WORK/challenges/.well-known/acme-challenge"
  printf 'core-token-proof' >"$WORK/challenges/.well-known/acme-challenge/test-token"
  sudo docker run -d --rm --name "$backend_name" --network "container:$identifier" \
    -v "$WORK/challenges:/files:ro" python:3.12-alpine \
    python -m http.server 9090 --bind 127.0.0.1 --directory /files >/dev/null
  proof=
  for ((attempt=0; attempt<30; attempt++)); do
    proof=$(curl --noproxy '*' -sS -H 'Host: core.invalid' http://127.0.0.1/.well-known/acme-challenge/test-token || true)
    [[ $proof != core-token-proof ]] || break
    sleep 1
  done
  sudo docker rm -f "$backend_name" >/dev/null
  [[ $proof == core-token-proof ]] || { printf 'Core HTTP challenge not forwarded.\n' >&2; return 1; }
  status=$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' -H 'Host: unknown.invalid' \
    http://127.0.0.1/.well-known/acme-challenge/test-token)
  [[ $status == 404 ]] || { printf 'Unknown domain was forwarded.\n' >&2; return 1; }
  printf 'Shared ACME HTTP gateway passed without public CA requests.\n'
}
