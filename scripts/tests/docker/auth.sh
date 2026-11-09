#!/usr/bin/env bash
# Two-step login and root-only recovery in the disposable CI installation.
login_panel
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PUT --data '{"currentPassword":"integration-test-password-only","password":"integration-cloud-password-only"}' \
  "$URL/api/admin/cloud-password" | jq -e '.loginRequired' >/dev/null
[[ $(curl -sS -b "$WORK/cookies" -o /dev/null -w '%{http_code}' "$URL/api/session") == 401 ]]
ticket=$(curl -fsS -c "$WORK/cloud-cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$URL/api/login" | \
  jq -er 'select((.ok | not) and .cloudPasswordRequired) | .challenge')
[[ $(curl -sS -b "$WORK/cloud-cookies" -o /dev/null -w '%{http_code}' "$URL/api/session") == 401 ]]
jq -n --arg challenge "$ticket" '{challenge:$challenge,password:"integration-cloud-password-only"}' >"$WORK/cloud-login.json"
curl -fsS -c "$WORK/cloud-cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data-binary "@$WORK/cloud-login.json" "$URL/api/login/cloud" | jq -e '.ok' >/dev/null
curl -fsS -b "$WORK/cloud-cookies" "$URL/api/session" | jq -e '.ok' >/dev/null
[[ $(curl -sS -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data-binary "@$WORK/cloud-login.json" -o /dev/null -w '%{http_code}' "$URL/api/login/cloud") == 410 ]]
manager cloud-password-reset
login_panel
curl -fsS -b "$WORK/cookies" "$URL/api/admin/cloud-password" | jq -e '(.enabled | not)' >/dev/null
printf 'Cloud password, two-step authentication and root recovery passed.\n'
manager password-reset >"$WORK/password-reset-output"
chmod 600 "$WORK/password-reset-output"
sed -n 's/^Пароль: //p' "$WORK/password-reset-output" >"$WORK/password-reset-secret"
chmod 600 "$WORK/password-reset-secret"
grep -Eq '^[a-f0-9]{48}$' "$WORK/password-reset-secret"
[[ $(curl -sS -b "$WORK/cookies" -o /dev/null -w '%{http_code}' "$URL/api/session") == 401 ]]
[[ $(curl -sS -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' -o /dev/null -w '%{http_code}' "$URL/api/login") == 401 ]]
jq -n --rawfile password "$WORK/password-reset-secret" '{username:"admin",password:($password|rtrimstr("\n"))}' >"$WORK/password-reset-login.json"
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data-binary "@$WORK/password-reset-login.json" "$URL/api/login" | jq -e '.ok' >/dev/null
jq -n --rawfile password "$WORK/password-reset-secret" '{username:"admin",currentPassword:($password|rtrimstr("\n")),password:"integration-test-password-only"}' >"$WORK/password-restore.json"
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PUT --data-binary "@$WORK/password-restore.json" "$URL/api/admin/account" | jq -e '.loginRequired' >/dev/null
login_panel
printf 'Administrator password recovery and previous-session rejection passed.\n'
