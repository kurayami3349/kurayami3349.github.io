#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

host="127.0.0.1"
while (($#)); do
  case "$1" in
    -H|--host)
      [[ $# -ge 2 ]] || { echo "Missing host" >&2; exit 1; }
      host="$2"
      shift 2
      ;;
    -p|--production) export JEKYLL_ENV=production; shift ;;
    -h|--help)
      echo "Usage: bash tools/run.sh [-H host] [-p]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# An argument array keeps host values from being interpreted as shell code.
command=(bundle exec jekyll serve --livereload --host "$host")
if [[ -f /.dockerenv ]]; then
  command+=(--force_polling)
fi
exec "${command[@]}"
