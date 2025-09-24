#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
    Usage:
        python tools/convert_paper_note.py path/to/input_note.md title --date YYYY-MM-DD [--output-dir output_dir]
"""

import os
import sys
import re
from datetime import datetime
import argparse
import shutil

root_dir = os.path.dirname(os.path.dirname(__file__))

def create_front_matter(title, date):
    """创建Jekyll文章的front matter"""
    return f"""---
title: {title}
date: {date}
categories: [论文笔记]
tags: [待设置]
description: 待添加文章描述
---

{{% include paper_note_style.html %}}

<div class="paper-note-container" markdown="1">
"""

def process_content(content):
    """处理Markdown内容，添加必要的格式化和结构"""
    # 移除开头的空行
    content = content.lstrip()
    
    # 添加PDF嵌入提示（作为注释）
    pdf_comment = """<!--
要嵌入PDF，请在Meta Data部分后添加以下代码：
{% include pdf_embed.html url="/path/to/your/paper.pdf" %}
-->
"""
    
    # 在Meta Data部分后添加PDF嵌入提示
    meta_data_end = content.find("***", content.find("### Meta Data"))
    if meta_data_end != -1:
        content = content[:meta_data_end] + "\n" + pdf_comment + content[meta_data_end:]
    
    # 确保内容以</div>结尾
    content = content.rstrip() + "\n\n</div>"
    
    return content

def convert_note(input_file, title, date, output_dir):
    """转换笔记文件为Jekyll格式"""
    try:
        # 检查输入文件是否存在
        if not os.path.exists(input_file):
            print(f"\n❌ 错误：找不到输入文件：{input_file}")
            return False
            
        # 读取原始笔记内容
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 处理内容
        processed_content = process_content(content)
        
        # 创建完整的文章内容
        full_content = create_front_matter(title, date) + processed_content
        
        # 生成输出文件名
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        file_name = f"{date}-{title.lower().replace(' ', '-')}.md"
        output_file = os.path.join(output_dir, file_name)
        
        # 写入新文件
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print(f"\n✅ 笔记转换成功！")
        print(f"📝 新文件已创建：{output_file}")
        print("\n⚠️ 请注意：")
        print("1. 设置合适的文章标签 (tags)")
        print("2. 添加文章描述 (description)")
        print("3. 如需嵌入PDF，请按文件中的注释说明添加PDF嵌入代码")
        print("4. 检查并调整文章的格式和内容")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 转换过程中出现错误：{str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='将原始Markdown笔记转换为Jekyll博客格式')
    parser.add_argument('input_file', help='输入的Markdown文件路径')
    parser.add_argument('title', help='文章标题')
    parser.add_argument('--date', help='发布日期 (YYYY-MM-DD格式)', default=datetime.now().strftime('%Y-%m-%d'))
    parser.add_argument('--output-dir', help='输出目录', default=f"{root_dir}/_posts")
    
    args = parser.parse_args()
    
    
    # 转换笔记
    success = convert_note(args.input_file, args.title, args.date, args.output_dir)
    
    if success:
        print("\n🎉 转换完成！请检查新生成的文件并进行必要的调整。")
    else:
        print("\n❌ 转换失败，请检查错误信息并重试。")

if __name__ == '__main__':
    main()