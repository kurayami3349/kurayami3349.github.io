#!/usr/bin/env bash
# Publish only explicitly staged changes after checking the working tree.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

message="Update blog content"
while (($#)); do
  case "$1" in
    -m|--message)
      [[ $# -ge 2 ]] || { echo "Missing commit message" >&2; exit 1; }
      message="$2"
      shift 2
      ;;
    -h|--help)
      echo 'Usage: bash tools/publish.sh [-m "commit message"]'
      echo 'Stage the intended files with git add first. Publishes main to origin/main.'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[[ "$(git branch --show-current)" == main ]] || {
  echo "Publishing is only supported from main." >&2; exit 1;
}
if git diff --cached --quiet; then
  echo "No staged changes. Stage the intended files with git add first."
  exit 0
fi
check_worktree() {
  if ! git diff --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    echo "Unstaged changes or untracked files found. Resolve them so tests check exactly what will be committed." >&2
    exit 1
  fi
}
check_worktree
bash tools/test.sh
check_worktree
git commit -m "$message"
git push origin HEAD:main
