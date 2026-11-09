#!/usr/bin/env bash
cloud_password_reset() {
  local sha=$1
  compose "$sha" stop panel
  if ! compose "$sha" run --rm --no-deps --entrypoint /usr/local/bin/panel panel --reset-cloud-password; then
    start_release "$sha" || true
    die "Не удалось сбросить облачный пароль."
  fi
  start_release "$sha" || die "Панель не прошла проверку после сброса."
  printf '%s\n' 'Облачный пароль отключён. Войдите с основным паролем.'
}
