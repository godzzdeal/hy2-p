#!/usr/bin/env bash
validate_domain() {
  local label
  local -a labels
  [[ $1 == *.* && ${#1} -le 253 && $1 != *..* ]] || return 1
  IFS=. read -r -a labels <<<"$1"
  for label in "${labels[@]}"; do
    [[ $label =~ ^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$ ]] || return 1
  done
}
validate_address() {
  local part compressed=${1//[^:]}; local -a parts
  if [[ $1 == *:* ]]; then
    [[ $1 =~ ^[0-9a-fA-F:]+$ && $1 != *:::* ]] || return 1
    IFS=: read -r -a parts <<<"$1"
    for part in "${parts[@]}"; do [[ ${#part} -le 4 ]] || return 1; done
    if [[ $1 == *::* ]]; then
      part=${1/::/x}; [[ $part != *::* && ${#compressed} -le 8 ]] || return 1
    else
      [[ ${#compressed} == 7 && $1 != :* && $1 != *: ]] || return 1
    fi
  elif [[ $1 =~ ^[0-9.]+$ ]]; then
    IFS=. read -r -a parts <<<"$1"
    [[ ${#parts[@]} == 4 && $1 != *. ]] || return 1
    for part in "${parts[@]}"; do [[ $part =~ ^(0|[1-9][0-9]{0,2})$ && $part -le 255 ]] || return 1; done
  else validate_domain "$1"; fi
}
read_confirmation() {
  local answer
  while true; do
    read -r -u 3 -p "$1 [yes/no]: " answer || return 1
    case ${answer,,} in
      y|yes) return 0 ;;
      n|no) return 1 ;;
      '') [[ $2 == yes ]] && return 0; return 1 ;;
      *) log "Введите yes или no; можно y или n." ;;
    esac
  done
}
configure_installation() {
  local domain=${HY2_DOMAIN:-} email=${HY2_EMAIL:-} username=${HY2_USERNAME:-admin}
  local port=${HY2_PORT:-} password=${HY2_ADMIN_PASSWORD:-} answer accepted=${HY2_ACCEPT_ACME_TERMS:-false}
  local use_http=${HY2_HTTP:-false} url_host
  if [[ ${HY2_NONINTERACTIVE:-false} != true ]]; then
    exec 3</dev/tty
    if [[ -z $domain ]]; then read -r -u 3 -p 'Домен или публичный IP панели (Enter для SSH): ' domain; fi
    if [[ -n $domain && $use_http != true ]]; then
      if ! read_confirmation 'Использовать HTTPS с автопродлением сертификата?' yes; then use_http=true; fi
    fi
    read -r -u 3 -p "Логин администратора [$username]: " answer
    username=${answer:-$username}
    if [[ -n $domain && $use_http != true && -z $email ]]; then read -r -u 3 -p 'Email для сертификата: ' email; fi
    if [[ -n $domain && $use_http != true && $accepted != true ]]; then
      log "Let's Encrypt: https://letsencrypt.org/repository/"
      if read_confirmation 'Принимаете условия центра сертификации?' no; then accepted=true; fi
    fi
    exec 3<&-
  fi
  [[ $username =~ ^[A-Za-z0-9_.-]{3,64}$ ]] || die "Логин: 3–64 латинских символа, цифры, _, . или -."
  [[ -n $password ]] || password=$(openssl rand -hex 24)
  [[ $password =~ ^[A-Za-z0-9_@%+=:.,/-]{16,72}$ ]] ||
    die "Начальный пароль: 16–72 ASCII-символа без пробелов, кавычек и #."
  local mode=http bind=127.0.0.1 acme=false url=
  [[ $use_http != true || -n $domain ]] || die "Для HTTP укажите --address IP_СЕРВЕРА или --domain."
  if [[ -n $domain ]]; then
    validate_address "$domain" || die "Укажите домен или IP без схемы, порта и пути."
    bind=0.0.0.0; url_host=$domain
    if [[ $domain == *:* ]]; then bind=::; url_host="[$domain]"; fi
    if [[ $use_http == true ]]; then
      port=${port:-8080}; url="http://$url_host:$port"
      log "Прямой доступ по HTTP: соединение не зашифровано. Разрешите входящий TCP $port."
    else
    [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "Некорректный email."
    [[ $accepted == true ]] || die "Для ACME нужны принятые условия (--accept-acme-terms)."
    mode=acme; acme=true; port=${port:-9443}
    url="https://$url_host:$port"
    log "Адрес $domain должен вести на сервер; для выпуска и продления нужны входящие TCP 80 и $port."
    fi
  else
    port=${port:-8080}
  fi
  [[ $port =~ ^[1-9][0-9]{3,4}$ && $port -ge 1024 && $port -le 65535 && $port != 8081 && $port != 9080 && ( $port -lt 9090 || $port -gt 9097 ) && ( $port -lt 9999 || $port -gt 10006 ) ]] ||
    die "Выберите порт 1024–65535, кроме 8081, 9080, 9090–9097 и 9999–10006."
  cat >"$ROOT/.env" <<EOF
PANEL_ADMIN_USERNAME=$username
PANEL_ADMIN_PASSWORD=$password
PANEL_PORT=$port
PANEL_BIND=$bind
PANEL_PUBLIC_URL=$url
PANEL_SECURE_COOKIE=false
PANEL_TLS_MODE=$mode
PANEL_DOMAIN=$domain
PANEL_ACME_EMAIL=$email
PANEL_ACME_ACCEPT_TERMS=$accepted
PANEL_ACME_ENABLED=$acme
PANEL_ACME_PORT=9080
EOF
  chmod 600 "$ROOT/.env"
}
