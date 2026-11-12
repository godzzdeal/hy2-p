#!/usr/bin/env bash
MIMIC_VERSION=0.7.1
mimic_autoload() {
  local file=/etc/modules-load.d/hy2-panel-mimic.conf
  if [[ -e $file || -L $file ]]; then
    [[ -f $file && ! -L $file ]] && grep -Fxq "# HY2-P $ROOT" "$file" || die "Файл $file принадлежит другой установке."
  fi
  if [[ $1 == disable ]]; then rm -f -- "$file"
  else printf '# HY2-P %s\nmimic\n' "$ROOT" >"$file"; chmod 644 "$file"; fi
}

install_mimic_module() {
  local kernel architecture package directory url expected actual was_installed=false
  kernel=$(uname -r)
  [[ $(printf '6.1\n%s\n' "${kernel%%-*}" | sort -V | head -n 1) == 6.1 ]] ||
    die "Mimic требует Linux 6.1 или новее. Ядро Linux не обновляется автоматически."
  if modinfo mimic >/dev/null 2>&1; then modprobe mimic; return; fi
  # shellcheck source=/dev/null
  source /etc/os-release
  [[ $ID == ubuntu && ( $VERSION_ID == 24.04 || $VERSION_ID == 26.04 || $VERSION_ID == 26.10 ) ]] ||
    die "Автоустановка модуля поддерживает Ubuntu 24.04 и новее. Для другой ОС установите mimic-dkms по документации Mimic."
  architecture=$(dpkg --print-architecture)
  [[ $architecture == amd64 || $architecture == arm64 ]] || die "Нужна архитектура AMD64 или ARM64."
  directory=$(mktemp -d "$ROOT/.mimic-download.XXXXXX") || return 1
  package="noble_mimic-dkms_${MIMIC_VERSION}-1_${architecture}.deb"
  url="https://github.com/hack3ric/mimic/releases/download/v$MIMIC_VERSION/$package"
  if ! curl -fsSL --retry 3 --proto '=https' --tlsv1.2 "$url" -o "$directory/$package" ||
    ! curl -fsSL --retry 3 --proto '=https' --tlsv1.2 "$url.sha256" -o "$directory/checksum"; then
    rm -rf -- "$directory"; return 1
  fi
  expected=$(awk 'NR==1 {print $1}' "$directory/checksum")
  actual=$(sha256sum "$directory/$package")
  if [[ ! $expected =~ ^[a-f0-9]{64}$ || ${actual%% *} != "$expected" ]]; then
    rm -rf -- "$directory"; die "Проверка пакета Mimic не пройдена."
  fi
  if dpkg-query -W -f='${Status}' mimic-dkms 2>/dev/null | grep -q 'install ok installed'; then was_installed=true; fi
  if ! apt-get update || ! apt-get install -y "linux-headers-$kernel" dkms pahole bubblewrap kmod ||
    ! apt-get install -y "$directory/$package"; then rm -rf -- "$directory"; return 1; fi
  rm -rf -- "$directory"
  if [[ $was_installed == false ]]; then printf '%s\n' "$MIMIC_VERSION" >"$ROOT/mimic-module-owned"; fi
  modprobe mimic || { log 'Модуль не загружен. Проверьте журнал DKMS, Secure Boot и ограничения VPS.'; return 1; }
}

uninstall_mimic() {
  local sha=$1 option=${2:-} answer simulation packages
  [[ $# -le 2 && ( -z $option || $option == --yes ) ]] || die "Используйте mimic-uninstall [--yes]"
  log 'Режим Mimic будет отключён. Будут удалены его настройки установки и установленный панелью модуль, если он не используется другими программами.'
  if [[ $option != --yes ]]; then
    read -r -p 'Продолжить? [yes/no]: ' answer || return 0
    [[ $answer =~ ^([yY]|[yY][eE][sS])$ ]] || return 0
  fi
  if [[ $(env_read PANEL_MIMIC_ENABLED) == true ]]; then setup_mimic "$sha" --disable --yes || return 1
  else mimic_autoload disable || return 1; fi
  rm -f -- "$ROOT/compose-mimic.json"
  if [[ ! -f $ROOT/mimic-module-owned || -L $ROOT/mimic-module-owned ]]; then
    log 'Настройки Mimic удалены. Системный модуль не устанавливался этой панелью и сохранён.'
    return 0
  fi
  simulation=$(LC_ALL=C apt-get -s purge mimic-dkms) || return 1
  packages=$(awk '/^(Remv|Purg) / {print $2}' <<<"$simulation" | sort -u)
  [[ -z $packages || $packages == mimic-dkms ]] || { log 'Настройки удалены. Пакет модуля сохранён: от него зависят другие программы.'; return 0; }
  if [[ -d /sys/module/mimic ]] && ! modprobe -r mimic; then
    log 'Настройки удалены. Модуль используется другим процессом и сохранён.'
    return 0
  fi
  apt-get purge -y mimic-dkms || return 1
  rm -f -- "$ROOT/mimic-module-owned"
  log 'Mimic удалён.'
}
