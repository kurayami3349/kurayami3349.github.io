# SPDX-License-Identifier: MIT 
# Copyright (c) 2025 qq7r. All rights reserved.
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Usage:
  python tools/convert_paper_note.py path/to/input_note.md title \
    --date YYYY-MM-DD [--output-dir output_dir] [--image-base-url /assets/img] \
    [--images-output-dir path/to/copy/images]

该脚本将原始 Markdown 笔记转换为 Jekyll 博客文章格式，并可选地规范与重写图片引用。
同时会在内容中自动提取 arXiv id，并将其作为图片管理键用于：
- 复制图片到 `images_output_dir/arxiv-<id>/filename`
- 将相对图片链接重写为 `image_base_url/arxiv-<id>/filename`
"""

import os
import re
from datetime import datetime
import argparse
import shutil
from typing import Optional
import urllib.request
import urllib.error

root_dir = os.path.dirname(os.path.dirname(__file__))


class PaperNoteConverter:
  """将原始 Markdown 笔记转换为 Jekyll 博文的转换器。
  功能：
  - 生成带 front matter 的文章内容
  - 处理并规范图片引用（Markdown 与 HTML 两种形式）
  - 从内容中提取 arXiv id 作为图片管理键
  - 生成目标文件
  """

  def __init__(self, image_base_url: Optional[str] = "/img"):
    """初始化转换器。
    参数:
      image_base_url (Optional[str]): 图片基础 URL 前缀，未提供时默认使用 "/img"。
    """
    # 项目根目录默认取为当前脚本上级的上级目录
    self.root_dir = root_dir
    self.image_base_url = image_base_url or "/img"

  def create_front_matter(self, title: str, date: str) -> str:
    """创建 Jekyll 文章的 front matter。
    参数:
      title (str): 文章标题。
      date (str): 发布日期（YYYY-MM-DD）。
    返回:
      str: front matter 字符串。
    """
    return f"""---
title: {title}
date: {date}
categories: [论文笔记]
tags: [待设置]
description: 待添加文章描述
---

{{% include paper_note_style.html %}}

<div class=\"paper-note-container\" markdown=\"1\">
"""

  def process_content(self, content: str) -> str:
    """处理 Markdown 内容，添加必要的结构和提示。
    参数:
      content (str): 原始 Markdown 内容。
    返回:
      str: 处理后的内容。
    """
    content = content.lstrip()

    pdf_comment = """<!--
要嵌入PDF，请在Meta Data部分后添加以下代码：
{% include pdf_embed.html file=\"path/to/your/paper.pdf\" id=\"unique-id\" %}
-->
"""

    meta_data_pos = content.find("### Meta Data")
    meta_data_end = content.find("***", meta_data_pos) if meta_data_pos != -1 else -1
    if meta_data_end != -1:
      content = content[:meta_data_end] + "\n" + pdf_comment + content[meta_data_end:]

    content = content.rstrip() + "\n\n</div>"
    return content

  def arxiv_abs_exists(self, arxiv_id: str, timeout: float = 5.0) -> bool:
    """验证 arXiv abs 页面是否存在。
    参数:
      arxiv_id (str): 形如 '2504.18829' 或包含版本 '2504.18829v2' 的 arXiv id。
      timeout (float): 请求超时时间（秒）。
    返回:
      bool: 页面是否存在。
    """
    url = f"https://arxiv.org/abs/{arxiv_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "PaperNoteConverter/1.0", "Accept": "text/html"})
    try:
      with urllib.request.urlopen(req, timeout=timeout) as resp:
        return 200 <= getattr(resp, "status", 200) < 400
    except urllib.error.HTTPError as e:
      # 404 明确不存在；其他错误视为不可用
      return 200 <= e.code < 400
    except Exception:
      return False

  def extract_arxiv_key(self, content: str) -> Optional[str]:
    """从内容中提取 arXiv id，并返回用于图片管理的键。
    支持格式示例：
      "**ArXiv id:** arXiv:2504.18829"、"arXiv:2401.12345v2"，或 URL 形式 "https://arxiv.org/abs/2504.18829"。
    返回示例：
      "arxiv-2504.18829" 或 "arxiv-2401.12345v2"。

    参数:
      content (str): 原始 Markdown 内容。
    返回:
      Optional[str]: 规范化后的图片管理键，未找到则为 None。
    """
    # 1) 直接的 "arXiv:..." 写法，前置词边界
    m = re.search(r"(?i)\barxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)", content)
    if not m:
      # 2) "ArXiv id: arXiv:..." 写法
      m = re.search(r"(?i)arxiv\s*id\s*[:：]\s*arxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)", content)
    if not m:
      # 3) URL 写法
      m = re.search(r"(?i)https?://arxiv\.org/abs/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)", content)
    if not m:
      return None

    arxiv_id = m.group(1)

    # 先检查完整 id（可能包含版本）
    if self.arxiv_abs_exists(arxiv_id):
      return f"arxiv-{arxiv_id}"

    # 若包含版本且不存在，尝试去掉版本重新检查
    base_id = re.sub(r"v\d+$", "", arxiv_id)
    if base_id != arxiv_id and self.arxiv_abs_exists(base_id):
      print(f"⚠️ 未找到 arXiv 页面：{arxiv_id}，改用 {base_id}")
      return f"arxiv-{base_id}"

    print(f"⚠️ 未找到 arXiv 页面：{arxiv_id}，不使用图片分组键")
    return None

  def process_images(
    self,
    content: str,
    input_dir: Optional[str] = None,
    image_base_url: Optional[str] = None,
    copy_to_dir: Optional[str] = None,
    image_key: Optional[str] = None,
  ) -> str:
    """处理 Markdown 与 HTML 中的图片引用。
    行为：
    - 识别并处理 `![alt](src)` 与 `<img src=\"src\">` 两种格式；
    - 对相对路径图片：如提供 `image_base_url` 则重写为站点内路径（可在其后附加 `image_key` 子目录）；
      如提供 `copy_to_dir` 则复制图片到该目录（如有 `image_key` 则复制到其子目录）并保留文件名；
    - 对以 `http://`、`https://`、`/` 开头的绝对链接保持不变。
    - 统一图片的 alt 文本为顺序编号：fig1, fig2, ...（按出现顺序）。

    参数:
      content (str): 原始 Markdown 内容。
      input_dir (Optional[str]): 输入文件所在目录，用于解析相对路径图片源文件。
      image_base_url (Optional[str]): 站点内图片基础 URL 前缀（如 `/img`），未传时会使用类默认值。
      copy_to_dir (Optional[str]): 复制相对路径图片到该目录（可选）。
      image_key (Optional[str]): 图片管理键（如基于 arXiv id），用于子目录。
    返回:
      str: 已重写图片链接的内容。
    """
    def is_relative(src: str) -> bool:
      return not (src.startswith("http://") or src.startswith("https://") or src.startswith("/"))

    def rewrite_src(src: str) -> str:
      # 复制到指定目录（可选且仅处理相对路径）
      if copy_to_dir and input_dir and is_relative(src):
        try:
          target_dir = copy_to_dir if not image_key else os.path.join(copy_to_dir, image_key)
          os.makedirs(target_dir, exist_ok=True)
          src_abs = os.path.normpath(os.path.join(input_dir, src))
          if os.path.isfile(src_abs):
            shutil.copy2(src_abs, os.path.join(target_dir, os.path.basename(src)))
        except Exception:
          # 若复制失败，不影响转换流程，仅保留原链接或重写链接
          pass

      # 重写链接到站点路径（保留文件名）
      if image_base_url and is_relative(src):
        base = image_base_url.rstrip('/')
        if image_key:
          return f"{base}/{image_key}/{os.path.basename(src)}"
        return f"{base}/{os.path.basename(src)}"
      return src

    # 统一 alt 的顺序计数器
    fig_counter = 1

    # 处理 Markdown 图片：![alt](src)
    pattern_md = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")

    def repl_md(match: re.Match) -> str:
      nonlocal fig_counter
      src = match.group(2)
      new_src = rewrite_src(src)
      alt_text = f"fig{fig_counter}"
      fig_counter += 1
      return f"![{alt_text}]({new_src})"

    content = pattern_md.sub(repl_md, content)

    # 处理 HTML 图片：<img ... src=\"...\" ...>
    pattern_html = re.compile(r"<img([^>]*)src=\"([^\"]+)\"([^>]*)>")

    def set_alt(attrs: str, alt_text: str) -> str:
      # 替换已存在的 alt，或插入一个新的 alt
      if re.search(r"\balt\s*=\s*\"", attrs):
        return re.sub(r"\balt\s*=\s*\"[^\"]*\"", f"alt=\"{alt_text}\"", attrs)
      # 插入到属性开头，保持简单可靠
      return f" alt=\"{alt_text}\"{attrs}"

    def repl_html(match: re.Match) -> str:
      nonlocal fig_counter
      pre = match.group(1)
      src = match.group(2)
      post = match.group(3)
      new_src = rewrite_src(src)
      alt_text = f"fig{fig_counter}"
      fig_counter += 1
      attrs = f"{pre}src=\"{new_src}\"{post}"
      attrs = set_alt(attrs, alt_text)
      return f"<img{attrs}>"

    content = pattern_html.sub(repl_html, content)
    return content

  def convert_note(
    self,
    input_file: str,
    title: str,
    date: str,
    output_dir: Optional[str] = None,
    image_base_url: Optional[str] = None,
    images_output_dir: Optional[str] = None,
  ) -> bool:
    """转换笔记文件为 Jekyll 格式并可选处理图片。
    参数:
      input_file (str): 输入 Markdown 文件路径。
      title (str): 文章标题。
      date (str): 发布日期（YYYY-MM-DD）。
      output_dir (Optional[str]): 文章输出目录（未提供时默认 `root_dir/_posts`）。
      image_base_url (Optional[str]): 图片站点前缀（相对路径重写用，未提供时使用类的默认 "/img"）。
      images_output_dir (Optional[str]): 复制相对图片到该目录（未提供时默认 `root_dir/img`）。
    返回:
      bool: 转换是否成功。
    """
    try:
      if not os.path.exists(input_file):
        print(f"\n❌ 错误：找不到输入文件：{input_file}")
        return False

      with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

      # 从内容提取 arXiv id 作为图片管理键
      image_key = self.extract_arxiv_key(content)

      input_dir = os.path.dirname(input_file)
      # 设定有效的基础 URL、复制目录与输出目录
      effective_base_url = image_base_url if image_base_url is not None else self.image_base_url
      effective_copy_dir = images_output_dir if images_output_dir is not None else os.path.join(self.root_dir, "img")
      effective_output_dir = output_dir if output_dir is not None else os.path.join(self.root_dir, "_posts")

      content = self.process_images(
        content,
        input_dir=input_dir,
        image_base_url=effective_base_url,
        copy_to_dir=effective_copy_dir,
        image_key=image_key,
      )

      processed_content = self.process_content(content)
      full_content = self.create_front_matter(title, date) + processed_content

      # 验证日期格式
      _ = datetime.strptime(date, "%Y-%m-%d")

      os.makedirs(effective_output_dir, exist_ok=True)
      file_name = f"{date}-{title.lower().replace(' ', '-')}.md"
      output_file = os.path.join(effective_output_dir, file_name)

      with open(output_file, "w", encoding="utf-8") as f:
        f.write(full_content)

      print("\n✅ 笔记转换成功！")
      print(f"📝 新文件已创建：{output_file}")
      print("\n⚠️ 请注意：")
      print("1. 设置合适的文章标签 (tags)")
      print("2. 添加文章描述 (description)")
      print("3. 如需嵌入PDF，请按文件中的注释说明添加PDF嵌入代码")
      print("4. 检查并调整文章的格式和内容")
      print("5. 若使用了图片重写或复制，请核对图片是否正确显示")
      if image_key:
        print(f"6. 本文图片已按键分组：{image_key}")
      return True
    except Exception as e:
      print(f"\n❌ 转换过程中出现错误：{str(e)}")
      return False


def main():
  """命令行入口：解析参数并执行转换。"""
  parser = argparse.ArgumentParser(description="将原始Markdown笔记转换为Jekyll博客格式，并处理图片引用")
  parser.add_argument("input_file", help="输入的Markdown文件路径")
  parser.add_argument("title", help="文章标题")
  parser.add_argument("--date", help="发布日期 (YYYY-MM-DD格式)", default=datetime.now().strftime("%Y-%m-%d"))
  parser.add_argument("--output-dir", help="输出目录（默认 root_dir/_posts）", default=None)
  parser.add_argument("--image-base-url", help="图片基础URL前缀（用于重写相对路径，默认 /img）", default=None)
  parser.add_argument("--images-output-dir", help="复制相对图片到该目录（默认 root_dir/img）", default=None)

  args = parser.parse_args()

  converter = PaperNoteConverter()
  success = converter.convert_note(
    input_file=args.input_file,
    title=args.title,
    date=args.date,
    output_dir=args.output_dir,
    image_base_url=args.image_base_url,
    images_output_dir=args.images_output_dir,
  )

  if success:
    print("\n🎉 转换完成！请检查新生成的文件并进行必要的调整。")
  else:
    print("\n❌ 转换失败，请检查错误信息并重试。")


if __name__ == "__main__":
  main()