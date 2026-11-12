#!/usr/bin/env bash
set -Eeuo pipefail

can_reuse_checks() {
  local pulls head head_tree current_tree runs
  [[ $GITHUB_EVENT_NAME == push && $GITHUB_REF == refs/heads/main ]] || return 1
  pulls=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/pulls?per_page=100") || return 1
  head=$(jq -r --arg commit "$GITHUB_SHA" --arg repository "$GITHUB_REPOSITORY" '
    map(select(.merged_at != null and .base.ref == "main" and
      .merge_commit_sha == $commit and .head.repo.full_name == $repository))
    | .[0].head.sha // empty' <<<"$pulls") || return 1
  [[ $head =~ ^[a-f0-9]{40}$ ]] || return 1
  head_tree=$(gh api "repos/$GITHUB_REPOSITORY/git/commits/$head" --jq '.tree.sha') || return 1
  current_tree=$(git rev-parse 'HEAD^{tree}') || return 1
  [[ $head_tree =~ ^[a-f0-9]{40}$ && $head_tree == "$current_tree" ]] || return 1
  runs=$(gh api -X GET "repos/$GITHUB_REPOSITORY/actions/workflows/ci.yml/runs" \
    -f event=pull_request -f head_sha="$head" -f status=success -f per_page=100) || return 1
  jq -e --arg head "$head" --arg repository "$GITHUB_REPOSITORY" '
    any(.workflow_runs[]; .head_sha == $head and .event == "pull_request" and
      .path == ".github/workflows/ci.yml" and .status == "completed" and
      .conclusion == "success" and .head_repository.full_name == $repository)' <<<"$runs" >/dev/null
}

if can_reuse_checks; then
  printf 'reuse=true\n' >>"$GITHUB_OUTPUT"
  printf 'The main tree matches a PR with successful Checks. Reusing code checks.\n'
else
  printf 'reuse=false\n' >>"$GITHUB_OUTPUT"
  printf 'No matching verified PR tree. Running all code checks.\n'
fi
