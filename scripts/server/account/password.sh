#!/usr/bin/env bash
reset_admin_password() {
  local sha=$1 reset_password reset_account reset_username healthy=true
  reset_password=$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n') || die "Не удалось создать пароль."
  [[ $reset_password =~ ^[a-f0-9]{48}$ ]] || die "Не удалось создать пароль."
  compose "$sha" stop panel || return 1
  if ! reset_account=$(printf '%s\n' "$reset_password" |
    compose "$sha" run --rm --no-deps -T --entrypoint /usr/local/bin/panel panel --reset-admin-password); then
    start_release "$sha" || true
    die "Не удалось сбросить пароль администратора."
  fi
  reset_username=$(jq -er '.username' <<<"$reset_account") || reset_username='(прежний логин)'
  start_release "$sha" || healthy=false
  printf '\nЛогин: %s\nПароль: %s\nСохраните новый пароль. Действующие сеансы панели завершены.\n' "$reset_username" "$reset_password"
  if jq -e '.hasCloudPassword' <<<"$reset_account" >/dev/null; then
    printf 'Облачный пароль сохранён. Если он тоже забыт: sudo hy2-panel cloud-password-reset\n'
  fi
  [[ $healthy == true ]] || die "Пароль сброшен, но панель не прошла проверку запуска. Проверьте её журнал."
}
