#!/usr/bin/env bash
for install_test in wizard firewall; do
  # shellcheck source=/dev/null
  source "$(dirname -- "${BASH_SOURCE[0]}")/$install_test.sh"
done
printf 'Installer confirmation and optional firewall tests passed.\n'
