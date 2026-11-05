#!/usr/bin/env bash
ensure_docker() {
  if command -v docker >/dev/null && engine compose version >/dev/null 2>&1; then
    engine info >/dev/null || die "Docker установлен, но локальная служба не работает."
    return
  fi
  # Only a new Docker installation is automated; existing runtimes are not removed.
  if command -v docker >/dev/null; then die "Установите Docker Compose v2 для существующего Docker."; fi
  # shellcheck disable=SC1091
  source /etc/os-release
  [[ $ID == ubuntu ]] || die "Автоустановка Docker поддерживает Ubuntu."
  case $VERSION_ID in 22.04|24.04|26.04|26.10) ;; *) die "Неподдерживаемая версия Ubuntu: $VERSION_ID" ;; esac
  if dpkg-query -W -f='${Status}' containerd 2>/dev/null | grep -q 'install ok installed'; then
    die "Уже установлен containerd. Установите Docker по официальной инструкции, затем повторите."
  fi
  log "Устанавливаем Docker Engine и Compose из официального репозитория."
  install -m 0755 -d /etc/apt/keyrings
  curl --fail --show-error --silent --proto '=https' --tlsv1.2 \
    https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat >/etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  engine info >/dev/null
}
