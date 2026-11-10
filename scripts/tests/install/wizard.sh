#!/usr/bin/env bash
test_install_confirmation() {
  local answer
  for answer in y yes Y YES; do read_confirmation 'Test' no 3<<<"$answer" || return 1; done
  for answer in n no N NO; do if read_confirmation 'Test' yes 3<<<"$answer"; then return 1; fi; done
  read_confirmation 'Test' yes 3<<<'' || return 1
  if read_confirmation 'Test' no 3<<<''; then return 1; fi
  read_confirmation 'Test' no 3<<<$'invalid\ny' || return 1
}
test_install_confirmation
