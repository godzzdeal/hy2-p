#!/usr/bin/env bash
set -Eeuo pipefail

repository=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd -- "$repository"
audit_bin=${GO_AUDIT_BIN:-"$(go env GOPATH)/bin"}
for tool in staticcheck deadcode govulncheck; do
  if [[ ! -x $audit_bin/$tool ]]; then
    printf 'Missing Go audit tool: %s\n' "$audit_bin/$tool" >&2
    exit 127
  fi
done

go vet ./...
"$audit_bin/staticcheck" ./...
unreachable=$("$audit_bin/deadcode" -test ./...)
if [[ -n $unreachable ]]; then
  printf '%s\n' "$unreachable" >&2
  exit 1
fi
"$audit_bin/govulncheck" ./...
