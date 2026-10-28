# Repository Guidelines

## Project Structure & Module Organization

This repository is a Jekyll blog using the Chirpy theme. Published articles live in `_posts/`; use `YYYY-MM-DD-slug.md` filenames and YAML front matter. Navigation pages are in `_tabs/`, shared HTML snippets in `_includes/`, site data in `_data/`, and the custom Jekyll hook in `_plugins/`. Put article images under `img/` (existing paper figures use `img/arxiv-<id>/`), other static files under `assets/`, and source notes or attachments under `raw/`. Site settings are in `_config.yml`; helper scripts are in `tools/`. `_site/` is generated output.

## Build, Test, and Development Commands

- `bundle install`: install the gems in `Gemfile.lock`.
- `bash tools/run.sh`: serve the site locally with live reload at `127.0.0.1`; use `-H <host>` to change the bind address.
- `bundle exec jekyll build`: generate the site in `_site/`.
- `bash tools/test.sh`: rebuild in production mode and run HTMLProofer against generated pages and local links.
- `python3 tools/convert_paper_note.py --help`: inspect options for converting a raw paper note into a Jekyll post.

Run commands from the repository root. The test script replaces `_site/` before checking it.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, LF endings, a final newline, spaces with two-space indentation, and no trailing whitespace except where Markdown needs it. Use single quotes in JavaScript, CSS, and SCSS, and double quotes in YAML. Keep post front matter consistent with existing articles (`title`, `date`, `categories`, `tags`, `description`). Use descriptive slugs and root-relative image paths such as `/img/arxiv-2502.20900/figure.png`.

## Testing Guidelines

There is no separate unit-test suite or coverage target. For content, template, or configuration changes, run `bash tools/test.sh`; it uses Jekyll and HTMLProofer and skips external URL checks. Review the local preview for layout and image changes. If adding code with new behavior, include a focused test or reproducible check alongside it.

## Commit & Pull Request Guidelines

Recent commits mostly use short imperative subjects such as `Update blog content` or `Update _config.yml`. Use a specific subject describing the changed article or component. In pull requests, summarize the change, list the validation command and result, link any relevant issue, and include screenshots when the rendered page changes.

## Content Licensing

Code is MIT licensed under `LICENSE`; articles and media are covered by `LICENSE-Content`. Confirm reuse rights before adding third-party figures or other media.
