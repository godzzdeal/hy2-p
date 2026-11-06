#!/usr/bin/env bash
test_device_limit() {
  local bound_uri root_uri=${uri:?Run the core fixture first} device status _attempt
  token=${token:?Run the user fixture first}
  user_id=${user_id:?Run the user fixture first}
  extra_id=${extra_id:?Run the multi-core fixture first}
  socks_host=${socks_host:?Run the core fixture first}
  user_request PUT devices '{"limit":1}' >/dev/null
  status=$(curl -sS -o "$WORK/device-error" -D "$WORK/device-headers" -w '%{http_code}' "$URL/sub/$token")
  [[ $status == 403 ]] || return 1
  grep -qi '^x-hwid-not-supported: true' "$WORK/device-headers"
  [[ $(device_subscription fixture-device-0001) == 200 ]] || return 1
  base64 -d "$WORK/device-subscription" >"$WORK/device-uris"
  bound_uri=$(grep ':61258/' "$WORK/device-uris")
  [[ -n $bound_uri && $bound_uri != "$root_uri" ]] || return 1
  [[ $(device_subscription fixture-device-0002) == 403 ]] || return 1
  grep -qi '^x-hwid-max-devices-reached: true' "$WORK/device-headers"
  start_test_client "$bound_uri"
  wait_online 1
  curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$socks_host:11080" http://127.0.0.1:8081/health >/dev/null
  for _attempt in {1..30}; do
    curl -fsS -b "$WORK/cookies" "$URL/api/users/$user_id/devices" >"$WORK/devices.json"
    if jq -e '.devices[0].online > 0 and .devices[0].statusAvailable' "$WORK/devices.json" >/dev/null; then break; fi
    sleep 1
  done
  jq -e --arg core "$extra_id" '.limit == 1 and (.devices | length) == 1 and .devices[0].model == "Integration phone" and .devices[0].lastConnected != "" and .devices[0].core == $core and .devices[0].online > 0 and .devices[0].statusAvailable' "$WORK/devices.json" >/dev/null
  device=$(jq -er '.devices[0].id' "$WORK/devices.json")
  user_request PATCH "devices/$device" '{"blocked":true}' >/dev/null
  wait_online 0
  stop_test_client
  start_test_client "$bound_uri"
  assert_proxy_denied
  [[ $(device_subscription fixture-device-0001) == 403 ]] || return 1
  # A pre-limit standalone URI must not bypass device enrollment.
  stop_test_client
  start_test_client "$root_uri"
  assert_proxy_denied
  user_request PATCH "devices/$device" '{"blocked":false}' >/dev/null
  stop_test_client
  start_test_client "$bound_uri"
  wait_online 1
  user_request PUT devices '{"limit":0}' >/dev/null
  stop_test_client
  printf 'HWID enrollment, device cap, device metadata and cached-key revocation passed.\n'
}

