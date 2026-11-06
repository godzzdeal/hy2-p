#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export HY2_INSTALL_DIR=${HY2_INSTALL_DIR:-/opt/hy2-panel}
export HY2_NONINTERACTIVE=${HY2_NONINTERACTIVE:-false}
version=latest
usage() {
  cat <<'EOF'
HY2 Control installer for Ubuntu
  sudo bash install.sh [options]
  --version latest|main|vX.Y.Z   Panel version (default: latest release)
  --directory /opt/hy2-panel    Separate installation directory
  --domain panel.example.com   Public HTTPS with Let's Encrypt
  --email admin@example.com    ACME contact
  --accept-acme-terms          Explicit acceptance of Let's Encrypt terms
  --port 9443                  Panel TCP port (HTTP default: 8080)
  --username admin             Initial administrator username
  --yes                        No interactive questions; password is generated
Without a domain, the panel is accessible through an SSH tunnel.
EOF
}
while (($#)); do
  case $1 in
    --version|--directory|--domain|--email|--port|--username)
      (($#>=2)) || { usage; exit 1; }
      case $1 in
        --version) version=$2 ;;
        --directory) export HY2_INSTALL_DIR=$2 ;;
        --domain) export HY2_DOMAIN=$2 ;;
        --email) export HY2_EMAIL=$2 ;;
        --port) export HY2_PORT=$2 ;;
        --username) export HY2_USERNAME=$2 ;;
      esac
      shift 2 ;;
    --accept-acme-terms) export HY2_ACCEPT_ACME_TERMS=true; shift ;;
    --yes) export HY2_NONINTERACTIVE=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; usage; exit 1 ;;
  esac
done
[[ $EUID == 0 ]] || { printf 'Use sudo bash install.sh\n' >&2; exit 1; }
[[ $HY2_INSTALL_DIR =~ ^/[a-zA-Z0-9/_.-]+$ && $HY2_INSTALL_DIR != / && $HY2_INSTALL_DIR != /opt && $HY2_INSTALL_DIR != /tmp ]] || exit 1
[[ $(readlink -m -- "$HY2_INSTALL_DIR") == "$HY2_INSTALL_DIR" && ! -L $HY2_INSTALL_DIR ]] || exit 1
# shellcheck disable=SC1091
source /etc/os-release
[[ $ID == ubuntu ]] || { printf 'This installer requires Ubuntu.\n' >&2; exit 1; }

missing=false
for tool in git curl jq openssl flock; do command -v "$tool" >/dev/null || missing=true; done
if [[ $missing == true ]]; then
  apt-get update
  apt-get install -y ca-certificates curl git jq openssl util-linux
fi
if [[ $version == latest ]]; then
  version=$(curl -fsSL --retry 3 --proto '=https' --tlsv1.2 \
    https://api.github.com/repos/godzzdeal/hy2-p/releases/latest | jq -er '.tag_name')
fi
[[ $version == main || $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ || $version =~ ^[0-9a-f]{40}$ ]] || exit 1
mkdir -p -- "$HY2_INSTALL_DIR/releases"
chown root:root "$HY2_INSTALL_DIR"
chmod 700 "$HY2_INSTALL_DIR"
exec 9>"$HY2_INSTALL_DIR/.deployment.lock"
flock -n 9 || { printf 'Another installation is running.\n' >&2; exit 1; }
temporary=$(mktemp -d "$HY2_INSTALL_DIR/releases/.fetch.XXXXXX")
cleanup() { [[ ! -d $temporary || $temporary != "$HY2_INSTALL_DIR/releases/.fetch."* ]] || rm -rf -- "$temporary"; }
trap cleanup EXIT
git init -q "$temporary"
git -C "$temporary" remote add origin https://github.com/godzzdeal/hy2-p.git
git -C "$temporary" fetch --quiet --depth=1 origin "$version"
git -C "$temporary" -c advice.detachedHead=false checkout --quiet --detach FETCH_HEAD
sha=$(git -C "$temporary" rev-parse HEAD)
[[ $sha =~ ^[0-9a-f]{40}$ ]] || exit 1
release=$HY2_INSTALL_DIR/releases/$sha
if [[ -d $release ]]; then
  [[ -z $(git -C "$release" status --porcelain) ]] || { printf 'Release directory was modified.\n' >&2; exit 1; }
else
  mv -- "$temporary" "$release"
fi
if [[ -f $HY2_INSTALL_DIR/current ]]; then
  printf '%s\n' "$version" >"$HY2_INSTALL_DIR/image-version-$sha"
  flock -u 9
  exec bash "$release/scripts/server/manage.sh" update "$version"
fi
# shellcheck source=/dev/null
source "$release/scripts/server/common.sh"
printf '%s\n' "$version" >"$ROOT/image-version-$sha"
# shellcheck source=/dev/null
source "$release/scripts/server/releases/source/image.sh"
for file in docker wizard setup; do
  # shellcheck source=/dev/null
  source "$release/scripts/server/install/$file.sh"
done
# shellcheck source=/dev/null
source "$release/scripts/server/listener.sh"
install_panel "$sha"
