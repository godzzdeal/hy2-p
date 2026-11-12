#!/usr/bin/env bash
# shellcheck source=module.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/module.sh"
# shellcheck source=compose.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/compose.sh"

setup_mimic() (
  local sha=$1 instance=default is_disabling=false is_confirmed=false should_preview=false answer backup was_enabled
  local mimic_instance='' mimic_public='' mimic_target=''
  shift
  while (($#)); do
    case $1 in
      --instance) (($#>1)) || die "Укажите ID экземпляра."; instance=$2; shift ;;
      --disable) is_disabling=true ;;
      --yes) is_confirmed=true ;;
      --dry-run) should_preview=true ;;
      *) die "Используйте mimic-setup [--instance ID] [--disable] [--dry-run] [--yes]" ;;
    esac
    shift
  done
  [[ $instance =~ ^(default|[a-f0-9]{16})$ ]] || die "Некорректный ID экземпляра."
  [[ $is_disabling == true || -f $ROOT/releases/$sha/scripts/server/mimic/setup.sh ]] || return 1
  log 'Mimic нужен и на Linux-клиенте. Обычные приложения на телефоне не подключатся к экземпляру с Mimic.'
  if [[ $is_disabling == true ]]; then log 'Режим Mimic будет отключён. Панель вернётся к запуску от обычного пользователя.'
  else
    log "Режим Mimic для экземпляра $instance: установка модуля Linux, TCP-порт вместе с UDP, перезапуск панели."
    log 'Контейнер панели получит root и только DAC_OVERRIDE, NET_ADMIN, NET_RAW, BPF, PERFMON; сеть остаётся изолированной.'
  fi
  [[ $should_preview != true ]] || return 0
  if [[ $is_confirmed != true ]]; then
    read -r -p 'Продолжить? [yes/no]: ' answer || return 0
    [[ $answer =~ ^([yY]|[yY][eE][sS])$ ]] || return 0
  fi
  if [[ $is_disabling != true ]]; then
    mimic_ports "$instance" || die "Сначала опубликуйте UDP-порт выбранного экземпляра."
    log "TCP $mimic_public → $mimic_target, экземпляр $mimic_instance."
    engine run --rm --network none --entrypoint /usr/local/bin/mimic "$(image_for "$sha")" --version ||
      die "В образе нет программы Mimic. Обновите панель до версии с поддержкой Mimic."
    install_mimic_module || die "Установка модуля не завершена. Права контейнера не изменены."
    mimic_autoload enable || die "Не удалось настроить загрузку модуля. Права контейнера не изменены."
  fi
  backup=$(mktemp "$ROOT/.mimic-environment.XXXXXX") || return 1
  cp -- "$ROOT/.env" "$backup" || exit 1
  was_enabled=$(env_read PANEL_MIMIC_ENABLED)
  recover_mimic_setup() {
    local result=$?
    trap - EXIT
    if [[ $result != 0 ]]; then
      log 'Не удалось применить режим Mimic. Возвращаем параметры запуска.'
      compose "$sha" stop panel || true
      cp -- "$backup" "$ROOT/.env"
      if [[ $was_enabled != true ]]; then normalize_mimic_ownership "$sha" || true; fi
      start_release "$sha" || log 'Проверьте запуск: sudo hy2-panel status'
    fi
    rm -f -- "$backup"
    exit "$result"
  }
  trap recover_mimic_setup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  compose "$sha" stop panel || exit 1
  if [[ $is_disabling == true ]]; then
    normalize_mimic_ownership "$sha" || exit 1
    env_set PANEL_MIMIC_ENABLED false || exit 1
  else
    mimic_profile >"$ROOT/.compose-mimic.json" && mv -- "$ROOT/.compose-mimic.json" "$ROOT/compose-mimic.json" || exit 1
    env_set PANEL_MIMIC_INSTANCE "$instance" && env_set PANEL_MIMIC_ENABLED true || exit 1
  fi
  start_release "$sha" || exit 1
  if [[ $is_disabling == true ]]; then
    mimic_autoload disable || exit 1
    log 'Режим Mimic выключен. Установленный модуль Linux сохранён.'
  else
    log 'Режим установки Mimic готов. В редакторе выберите Mimic, проверьте готовность и включите mimic.enabled.'
    log 'Разрешите TCP и UDP на порту экземпляра в firewall сервера и хостинга.'
  fi
)
