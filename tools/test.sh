#!/usr/bin/env bash
# Build the same artifact locally and in CI, then validate it.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

config="_config.yml"
while (($#)); do
  case "$1" in
    -c|--config)
      [[ $# -ge 2 ]] || { echo "Missing config path" >&2; exit 1; }
      config="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: bash tools/test.sh [-c config.yml]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

python3 -m unittest discover -s tests -v
bundle exec ruby tools/check_content.rb
JEKYLL_ENV=production bundle exec jekyll build --destination _site --config "$config"
python3 tools/check_site.py _site
bundle exec htmlproofer _site \
  --disable-external \
  --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/"
