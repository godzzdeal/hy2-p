#!/usr/bin/env bash
for configuration_file in wizard firewall; do
  # shellcheck source=/dev/null
  source "$(dirname -- "${BASH_SOURCE[0]}")/$configuration_file.sh"
done
