#!/usr/bin/env bash
set -Eeuo pipefail
WORK=$(mktemp -d /tmp/hy2-reuse-checks.XXXXXX)
trap '[[ $WORK == /tmp/hy2-reuse-checks.* ]] && rm -rf -- "$WORK"' EXIT
export GITHUB_REPOSITORY=owner/panel
export GITHUB_SHA=1111111111111111111111111111111111111111
export TREE=2222222222222222222222222222222222222222
export HEAD_SHA=3333333333333333333333333333333333333333
export GITHUB_OUTPUT=$WORK/output EVENTS=$WORK/events CASE

gh() {
  printf '%s\n' "$*" >>"$EVENTS"
  [[ $CASE != offline ]] || return 1
  case $* in
    *'/pulls?'*)
      if [[ $CASE == no-pr ]]; then printf '[]\n'; return; fi
      jq -n --arg commit "$GITHUB_SHA" --arg head "$HEAD_SHA" --arg repository "$GITHUB_REPOSITORY" \
        '[{merged_at:"2026-11-12",merge_commit_sha:$commit,base:{ref:"main"},head:{sha:$head,repo:{full_name:$repository}}}]' ;;
    *'/git/commits/'*)
      if [[ $CASE == changed-tree ]]; then printf '%040d\n' 0; else printf '%s\n' "$TREE"; fi ;;
    *'/actions/workflows/'*)
      local conclusion=success repository=$GITHUB_REPOSITORY
      [[ $CASE != failed ]] || conclusion=failure
      [[ $CASE != foreign ]] || repository=other/panel
      jq -n --arg head "$HEAD_SHA" --arg repository "$repository" --arg conclusion "$conclusion" \
        '{workflow_runs:[{head_sha:$head,event:"pull_request",path:".github/workflows/ci.yml",status:"completed",conclusion:$conclusion,head_repository:{full_name:$repository}}]}' ;;
    *) return 1 ;;
  esac
}
git() { printf '%s\n' "$TREE"; }
export -f gh git

check_case() {
  export CASE=$1 GITHUB_EVENT_NAME=${3:-push} GITHUB_REF=${4:-refs/heads/main}
  : >"$GITHUB_OUTPUT"; : >"$EVENTS"
  bash "$(dirname -- "${BASH_SOURCE[0]}")/reuse-checks.sh"
  [[ $(cat "$GITHUB_OUTPUT") == "reuse=$2" ]] || { printf 'Failed case: %s\n' "$CASE"; exit 1; }
}
check_case verified true
for scenario in changed-tree offline no-pr failed foreign; do check_case "$scenario" false; done
check_case pr false pull_request refs/pull/1/merge
[[ ! -s $EVENTS ]]
check_case manual false workflow_dispatch
[[ ! -s $EVENTS ]]
printf 'Verified-tree reuse and full-check fallback tests passed.\n'
