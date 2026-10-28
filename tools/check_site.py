"""Check the built artifact's publication boundaries and license display."""
from html.parser import HTMLParser
from pathlib import Path
import sys


class FooterParser(HTMLParser):
  def __init__(self):
    super().__init__()
    self.in_footer = False
    self.parts = []

  def handle_starttag(self, tag, attrs):
    if tag == 'footer':
      self.in_footer = True
    if self.in_footer:
      self.parts.extend(value or '' for _, value in attrs)

  def handle_endtag(self, tag):
    if tag == 'footer':
      self.in_footer = False

  def handle_data(self, text):
    if self.in_footer:
      self.parts.append(text)


def main():
  root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
  errors = []
  for name in ['raw', 'tools', 'tests', 'docs', 'assets/lib', 'AGENTS.md', 'README', 'README.md',
               'Gemfile', 'Gemfile.lock', '.git', '.agents', '.codex']:
    if (root / name).exists():
      errors.append(f'Private repository file included in site: {name}')
  if not (root / 'license/index.html').is_file():
    errors.append('Public content license page is missing')
  for page in [root / 'index.html', *root.glob('posts/*/index.html')]:
    if not page.is_file():
      errors.append(f'Missing page: {page}')
      continue
    parser = FooterParser()
    parser.feed(page.read_text(encoding='utf-8'))
    footer = ''.join(parser.parts)
    if 'CC BY' in footer or '保留所有权利' not in footer:
      errors.append(f'Incorrect content license in footer: {page}')
  if errors:
    sys.exit('\n'.join(errors))
  print('Publication boundaries and footer licenses checked.')


if __name__ == '__main__':
  main()
