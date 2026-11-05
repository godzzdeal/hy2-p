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
configure_installation() {
  local domain=${HY2_DOMAIN:-} email=${HY2_EMAIL:-} username=${HY2_USERNAME:-admin}
  local port=${HY2_PORT:-} password=${HY2_ADMIN_PASSWORD:-} answer accepted=${HY2_ACCEPT_ACME_TERMS:-false}
  if [[ ${HY2_NONINTERACTIVE:-false} != true ]]; then
    exec 3</dev/tty
    if [[ -z $domain ]]; then read -r -u 3 -p 'Домен панели (Enter — доступ через SSH): ' domain; fi
    read -r -u 3 -p "Логин администратора [$username]: " answer
    username=${answer:-$username}
    if [[ -n $domain && -z $email ]]; then read -r -u 3 -p 'Email для сертификата: ' email; fi
    if [[ -n $domain && $accepted != true ]]; then
      log "Let's Encrypt: https://letsencrypt.org/repository/"
      read -r -u 3 -p 'Принимаете условия центра сертификации? [yes/NO]: ' answer
      [[ $answer != yes ]] || accepted=true
    fi
    exec 3<&-
  fi
  [[ $username =~ ^[A-Za-z0-9_.-]{3,64}$ ]] || die "Логин: 3–64 латинских символа, цифры, _, . или -."
  [[ -n $password ]] || password=$(openssl rand -hex 24)
  [[ $password =~ ^[A-Za-z0-9_@%+=:.,/-]{16,72}$ ]] ||
    die "Начальный пароль: 16–72 ASCII-символа без пробелов, кавычек и #."
  local mode=http bind=127.0.0.1 acme=false url=
  if [[ -n $domain ]]; then
    validate_domain "$domain" || die "Укажите домен без схемы, порта и пути."
    [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "Некорректный email."
    [[ $accepted == true ]] || die "Для ACME нужны принятые условия (--accept-acme-terms)."
    mode=acme; bind=0.0.0.0; acme=true; port=${port:-9443}
    url="https://$domain:$port"
    log "DNS A-запись $domain должна указывать на сервер; нужны входящие TCP 80 и $port."
  else
    port=${port:-8080}
  fi
  [[ $port =~ ^[0-9]{4,5}$ && $port -ge 1024 && $port -le 65535 && $port != 8081 && $port != 9999 && $port != 9080 ]] ||
    die "Выберите порт 1024–65535, кроме 8081, 9080 и 9999."
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
