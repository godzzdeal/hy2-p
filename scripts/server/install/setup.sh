#!/usr/bin/env bash
install_panel() {
  local sha=$1 launcher=/usr/local/bin/hy2-panel
  [[ ! -f $ROOT/current ]] || die "Панель уже установлена. Используйте sudo hy2-panel update."
  mkdir -p -- "$ROOT/certs" "$ROOT/backups"
  chmod 700 "$ROOT" "$ROOT/backups"
  chown root:10001 "$ROOT/certs"
  chmod 750 "$ROOT/certs"
  if [[ ! -f $ROOT/.env ]]; then configure_installation; fi
  if [[ -e $launcher || -L $launcher ]]; then
    [[ -L $launcher && $(readlink -- "$launcher") == "$ROOT/hy2-panel" ]] ||
      die "$launcher уже занят другой программой."
  fi
  ensure_docker
  check_volume
  prepare_image "$sha"
  if ! open_install_ports; then log "Не удалось добавить все правила UFW. Проверьте firewall после установки."; fi
  if ! start_release "$sha"; then
    compose "$sha" logs --tail=80 panel >&2 || true
    compose "$sha" stop panel || true
    die "Первый запуск не прошёл проверку. .env и данные сохранены; повторите установку после исправления."
  fi
  state_write current "$sha"
  {
    printf '#!/usr/bin/env bash\nset -euo pipefail\nexport HY2_INSTALL_DIR=%q\n' "$ROOT"
    printf 'sha=$(cat "$HY2_INSTALL_DIR/current")\n'
    printf '[[ $sha =~ ^[0-9a-f]{40}$ ]] || exit 1\n'
    printf 'exec bash "$HY2_INSTALL_DIR/releases/$sha/scripts/server/manage.sh" "$@"\n'
  } >"$ROOT/hy2-panel"
  chmod 700 "$ROOT/hy2-panel"
  ln -sfnT -- "$ROOT/hy2-panel" "$launcher"
  log "Установка завершена."
  show_access
  log "Логин: $(env_read PANEL_ADMIN_USERNAME)"
  log "Начальный пароль: $(env_read PANEL_ADMIN_PASSWORD)"
  log "Данные входа также находятся в $ROOT/.env (доступ только root)."
}
