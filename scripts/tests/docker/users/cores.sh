#!/usr/bin/env bash
test_core_access() {
  token=${token:?Run the user fixture first}
  uri=${uri:?Run the core fixture first}
  socks_host=${socks_host:?Run the core fixture first}
  user_request PUT cores '{"mode":"selected","instances":["default"]}' >/dev/null
  wait_online 0
  curl -fsS "$URL/sub/$token" | base64 -d >"$WORK/restricted-subscription"
  [[ $(wc -l <"$WORK/restricted-subscription") == 1 ]] || return 1
  grep -q ':61256/' "$WORK/restricted-subscription"
  stop_test_client
  # The old, saved extra-core URI must also fail authentication.
  start_test_client "$uri"
  assert_proxy_denied
  user_request PUT cores '{"mode":"all","instances":[]}' >/dev/null
  stop_test_client
  start_test_client "$uri"
  wait_online 1
  curl -fsS --max-time 10 --noproxy "" --socks5-hostname "$socks_host:11080" http://127.0.0.1:8081/health >/dev/null
  printf 'Per-user core access, subscription filtering and rejection of cached URIs passed.\n'
}

