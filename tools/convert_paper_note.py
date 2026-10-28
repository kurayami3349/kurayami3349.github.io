#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 qq7r.
"""Convert a Markdown paper note into an unpublished Jekyll post, offline.

Relative images must be inside the input note's directory. Existing posts are
protected unless --force is supplied; different images never silently overwrite
one another. Review metadata and set published: true when ready to publish.
"""

import argparse
from datetime import datetime
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import sys
from typing import Optional
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class PaperNoteConverter:
  def __init__(self, image_base_url: Optional[str] = "/img"):
    self.root_dir = ROOT
    self.image_base_url = image_base_url or "/img"

  def extract_metadata(self, content: str):
    # Read Zotero's optional Meta Data block; leave unrecognized fields intact.
    paper, tags = {}, []
    block = re.search(r'^#{1,6}\s+Meta Data\s*\n(?P<body>.*?)(?=^#{1,6}\s|\Z)',
                      content, re.MULTILINE | re.DOTALL | re.IGNORECASE)
    if block:
      fields = {'title': 'title', 'author': 'authors', 'authors': 'authors',
                'abstract': 'abstract', 'url': 'url', 'doi': 'doi',
                'local link': 'local', 'venue': 'venue', 'code': 'code',
                'project': 'project', 'pdf': 'pdf', 'arxiv id': 'arxiv'}
      pattern = re.compile(
        r'^[*-] +\*\*(?P<label>[^*]+?)[:：]\*\*[ \t]*(?P<value>.*?)'
        r'(?=^[*-] +\*\*|\Z)', re.MULTILINE | re.DOTALL)

      def field(match):
        label = match['label'].lower().strip()
        value = match['value'].strip().strip('\\').strip()
        value = re.sub(r'\n(?:\*\*\*|---)\s*$', '', value).strip()
        if label == 'research tags':
          paper['subjects'] = re.findall(r'^\s*[*-] +(.+)', value, re.MULTILINE)
        elif label == 'tags':
          tags.extend(x.strip() for x in re.split(r'[,，]', value) if x.strip())
        elif label in fields:
          if label in ('url', 'doi', 'local link', 'code', 'project', 'pdf'):
            link = re.search(r'(?:https?://|zotero://)[^\s<>)]*', value)
            value = link[0] if link else value
          paper[fields[label]] = value
        else:
          return match[0]
        return ''

      remaining = pattern.sub(field, block['body']).strip()
      content = content[:block.start()] + remaining + '\n\n' + content[block.end():]
      content = re.sub(r'^# Note\s*\n', '', content)
    key = self.extract_arxiv_key('\n'.join([paper.get('arxiv', ''), paper.get('url', ''), content]))
    if key:
      arxiv = key.removeprefix('arxiv-')
      paper.setdefault('url', f'https://arxiv.org/abs/{arxiv}')
      paper.setdefault('pdf', f'https://arxiv.org/pdf/{arxiv}')
    return paper, tags, content.strip()

  def create_front_matter(self, title: str, date: str, paper=None, tags=None,
                         description='') -> str:
    # JSON values are valid YAML; no YAML dependency is needed for raw imports.
    data = {'layout': 'post', 'title': title, 'date': date, 'published': False,
            'categories': ['论文笔记'], 'tags': tags or [], 'description': description,
            'math': True, 'toc': True}
    front = '\n'.join(f'{key}: {json.dumps(value, ensure_ascii=False)}' for key, value in data.items())
    paper = {'title': title, 'authors': '', 'venue': '', 'url': '', 'pdf': '',
             'code': '', 'project': '', **(paper or {})}
    front += '\npaper:\n' + '\n'.join(
      f'  {key}: {json.dumps(value, ensure_ascii=False)}' for key, value in paper.items())
    return '---\n' + front + '''
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

'''

  def process_content(self, content: str) -> str:
    return content.strip() + "\n\n</div>\n"

  def extract_arxiv_key(self, content: str) -> Optional[str]:
    # Network availability must not change filenames or image URLs.
    match = re.search(
      r"(?i)(?:\barxiv:\s*|https?://arxiv\.org/(?:abs|pdf)/)"
      r"([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b", content
    )
    return f"arxiv-{match.group(1)}" if match else None

  @staticmethod
  def digest(path: Path) -> bytes:
    return hashlib.sha256(path.read_bytes()).digest()

  def process_images(self, content: str, input_dir=None, image_base_url=None,
                     copy_to_dir=None, image_key=None) -> str:
    source_root = Path(input_dir or ".").resolve()
    image_root = Path(copy_to_dir).resolve() if copy_to_dir else None
    if image_key and not re.fullmatch(r"[\w-]+(?:\.[\w-]+)*", image_key):
      raise ValueError("图片分组键无效")
    target_root = image_root / image_key if image_root and image_key else image_root
    if target_root and not target_root.resolve().is_relative_to(image_root):
      raise ValueError('图片分组目录不能位于输出目录之外')
    copies = {}

    def rewrite_src(src):
      parts = urlsplit(src)
      if parts.scheme in ("http", "https", "data") or src.startswith("/"):
        return src
      if parts.scheme:
        raise ValueError(f"不支持的图片协议：{parts.scheme}")
      if not image_base_url or not target_root:
        return src
      source = (source_root / unquote(parts.path)).resolve()
      if not source.is_relative_to(source_root):
        raise ValueError(f"图片不能位于笔记目录之外：{src}")
      if not source.is_file():
        raise FileNotFoundError(f"找不到图片：{src}")
      target = target_root / source.name
      if not target.resolve().is_relative_to(image_root):
        raise ValueError(f"图片目标不能位于输出目录之外：{target}")
      # Flattened names may collide, even within a single note.
      previous = copies.get(target, target if target.exists() else None)
      if previous is not None and self.digest(previous) != self.digest(source):
        raise FileExistsError(f"图片重名且内容不同，请先重命名：{target}")
      copies[target] = source
      segments = [image_base_url.rstrip("/")]
      if image_key:
        segments.append(image_key)
      segments.append(quote(source.name))
      url = "/".join(segments)
      if parts.query:
        url += "?" + parts.query
      if parts.fragment:
        url += "#" + parts.fragment
      return url

    markdown = re.compile(
      r'!\[(?P<alt>[^\]]*)\]\((?:<(?P<angle>[^>]+)>|(?P<src>[^\s()]+))'
      r'(?P<title>\s+(?:"[^"]*"|\x27[^\x27]*\x27))?\)'
    )
    image_tag = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
    source_attr = re.compile(r'''(?<![\w:-])src\s*=\s*(["'])(.*?)\1''', re.IGNORECASE)

    def markdown_image(match):
      src = rewrite_src(match.group("angle") or match.group("src"))
      alt = match.group('alt')
      if '<img' in alt:  # Zotero sometimes exports an HTML image inside Markdown alt text.
        label = re.search(r'\balt="([^"]*)"', alt)
        alt = label[1] if label and label[1] else '论文插图'
      return f'![{alt}]({src}{match.group("title") or ""})'

    def html_image(match):
      return source_attr.sub(
        lambda attr: 'src="' + html.escape(rewrite_src(html.unescape(attr.group(2))), quote=True) + '"',
        match.group(0), count=1
      )

    # Do not treat examples in fenced or inline code as actual images.
    chunks = re.split(r"(^```[^\n]*\n.*?^```[^\n]*$|^~~~[^\n]*\n.*?^~~~[^\n]*$|`[^`\n]+`)",
                      content, flags=re.MULTILINE | re.DOTALL)
    for index in range(0, len(chunks), 2):
      chunks[index] = image_tag.sub(html_image, markdown.sub(markdown_image, chunks[index]))
    result = "".join(chunks)
    # Validate every image before creating even an empty paper directory.
    if target_root and image_key:
      target_root.mkdir(parents=True, exist_ok=True)
    # Validate every image before copying any of them.
    for target, source in copies.items():
      target.parent.mkdir(parents=True, exist_ok=True)
      if not target.exists():
        # Exclusive creation also protects against a concurrent conversion.
        with target.open("xb") as destination, source.open("rb") as original:
          shutil.copyfileobj(original, destination)
    return result

  def convert_note(self, input_file: str, title: str, date: str,
                   output_dir=None, image_base_url=None, images_output_dir=None,
                   slug=None, force=False, tags=None, description='', paper_title=None,
                   authors=None, venue=None, paper_url=None, pdf=None, code=None, project=None) -> bool:
    try:
      if not title.strip():
        raise ValueError("文章标题不能为空")
      parsed_date = datetime.strptime(date, "%Y-%m-%d")
      if parsed_date.strftime("%Y-%m-%d") != date:
        raise ValueError("日期必须使用 YYYY-MM-DD 格式")
      slug = slug if slug is not None else re.sub(r"[^\w-]+", "-", title.lower()).strip("-_")
      if not slug or not re.fullmatch(r"[\w]+(?:[\w-]*[\w])?", slug):
        raise ValueError("slug 只能包含文字、数字、下划线和连字符")
      destination = Path(output_dir) if output_dir else self.root_dir / "_posts"
      output = destination / f"{date}-{slug}.md"
      if output.exists() and not force:
        raise FileExistsError(f"文章已存在；如需覆盖请使用 --force：{output}")
      if output.is_symlink():
        raise ValueError("不能覆盖符号链接文章")
      source = Path(input_file).resolve()
      content = source.read_text(encoding="utf-8")
      if content.lstrip().startswith("---\n"):
        raise ValueError("输入已包含 front matter，请直接编辑该文章，避免重复转换")
      paper, extracted_tags, content = self.extract_metadata(content)
      overrides = {'title': paper_title, 'authors': authors, 'venue': venue,
                   'url': paper_url, 'pdf': pdf, 'code': code, 'project': project}
      paper.update({key: value for key, value in overrides.items() if value is not None})
      if not paper.get('pdf'):
        key = self.extract_arxiv_key(paper.get('url', ''))
        if key:
          paper['pdf'] = 'https://arxiv.org/pdf/' + key.removeprefix('arxiv-')
      image_key = self.extract_arxiv_key('\n'.join([paper.get('arxiv', ''), paper.get('url', ''), paper.get('pdf', ''), content]))
      content = self.process_images(
        content, input_dir=source.parent,
        image_base_url=image_base_url if image_base_url is not None else self.image_base_url,
        copy_to_dir=images_output_dir if images_output_dir is not None else self.root_dir / "img",
        image_key=image_key,
      )
      full_content = self.create_front_matter(title, date, paper, tags if tags is not None else extracted_tags, description) + self.process_content(content)
      destination.mkdir(parents=True, exist_ok=True)
      with output.open("w" if force else "x", encoding="utf-8") as stream:
        stream.write(full_content)
      print(f"已生成未发布文章：{output}")
      print("请完善 tags、description 并检查正文；准备发布时设置 published: true。")
      return True
    except (OSError, ValueError) as error:
      print(f"转换失败：{error}", file=sys.stderr)
      return False


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("input_file", help="原始 Markdown 笔记路径")
  parser.add_argument("title", help="文章标题")
  parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
  parser.add_argument("--slug", help="文件名中的 slug，与显示标题分开")
  parser.add_argument("--output-dir")
  parser.add_argument("--image-base-url")
  parser.add_argument("--images-output-dir")
  parser.add_argument('--tag', dest='tags', action='append', help='博客标签，可重复传入；覆盖原始 Tags 字段')
  parser.add_argument('--description', default='', help='文章简介')
  for option in ('paper-title', 'authors', 'venue', 'paper-url', 'pdf', 'code', 'project'):
    parser.add_argument('--' + option, help='补充或覆盖论文元数据')
  parser.add_argument("--force", action="store_true", help="允许覆盖已有文章（不覆盖不同内容的图片）")
  args = parser.parse_args()
  return 0 if PaperNoteConverter().convert_note(**vars(args)) else 1


if __name__ == "__main__":
  sys.exit(main())
