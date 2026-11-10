#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
WORK=$(mktemp -d /tmp/hy2-images-test.XXXXXX)
cleanup() { [[ $WORK == /tmp/hy2-images-test.* ]] && rm -rf -- "$WORK"; }
trap cleanup EXIT
# shellcheck source=fixtures.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/fixtures.sh"
# shellcheck source=archive.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/archive.sh"
# shellcheck source=cleanup.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/cleanup.sh"
