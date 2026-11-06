"""Check the built artifact's publication boundaries and license display."""
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit


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


class NavigationParser(HTMLParser):
  """Collect links from their actual navigation block, excluding sidebar matches."""
  VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
               'link', 'meta', 'param', 'source', 'track', 'wbr'}

  def __init__(self):
    super().__init__()
    self.stack = []
    self.links = {name: set() for name in ['archive', 'taxonomy', 'topics', 'path', 'cards', 'membership']}

  def handle_starttag(self, tag, attrs):
    attrs = dict(attrs)
    scopes = set(self.stack[-1][1]) if self.stack else set()
    if attrs.get('id') in {'page-tag', 'page-category'}:
      scopes.add('archive')
    classes = attrs.get('class', '').split()
    for name, css in [('taxonomy', 'post-tail-wrapper'), ('topics', 'topic-steps'),
                      ('path', 'reading-path'), ('cards', 'post-taxonomy'),
                      ('membership', 'topic-membership')]:
      if css in classes:
        scopes.add(name)
    if tag == 'a' and attrs.get('href'):
      href = unquote(urlsplit(attrs['href']).path)
      for scope in scopes:
        self.links[scope].add(href)
    if tag not in self.VOID_TAGS:
      self.stack.append((tag, scopes))

  def handle_endtag(self, tag):
    for index in range(len(self.stack) - 1, -1, -1):
      if self.stack[index][0] == tag:
        del self.stack[index:]
        break


def navigation(page):
  parser = NavigationParser()
  parser.feed(page.read_text(encoding='utf-8'))
  return parser.links


def check_navigation(root, errors):
  topic_page = root / 'topics/index.html'
  if not topic_page.is_file():
    errors.append('Topic reading paths are missing')
    return
  topics = navigation(topic_page)['topics']
  archive_count = 0
  for post in root.glob('posts/*/index.html'):
    url = '/' + post.parent.relative_to(root).as_posix() + '/'
    links = navigation(post)
    if url not in topics or '/topics/' not in links['path']:
      errors.append(f'Post missing a round-trip topic reading path: {url}')
    if 'paper-note-container' in post.read_text(encoding='utf-8') and '/topics/' not in links['membership']:
      errors.append(f'Paper topic link failed to render as navigation: {url}')
    for href in links['taxonomy']:
      if not href.startswith(('/tags/', '/categories/')):
        continue
      archive = root / href.lstrip('/') / 'index.html'
      if not archive.is_file() or url not in navigation(archive)['archive']:
        errors.append(f'Post absent from its archive: {url} -> {href}')
      archive_count += 1
  cards = navigation(root / 'index.html')['cards']
  if not any(href.startswith('/tags/') for href in cards) or not any(href.startswith('/categories/') for href in cards):
    errors.append('Home cards need separate tag and category links')
  print(f'Checked topic round trips and {archive_count} post-to-archive memberships.')


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
  check_navigation(root, errors)
  if errors:
    sys.exit('\n'.join(errors))
  print('Publication boundaries and footer licenses checked.')


if __name__ == '__main__':
  main()
