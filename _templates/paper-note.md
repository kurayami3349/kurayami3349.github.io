---
layout: post
title: "论文简称：一句话概括核心问题"
date: 2026-10-28 00:00:00 +0800
published: false
categories: [论文笔记]
tags: [VLA] # 替换为这篇笔记的主题标签，保留迁移前的标签
description: "用一两句话说明这篇笔记的重点。"
math: true
toc: true # 使用 Chirpy 自带的侧栏目录
paper:
  title: "论文完整标题"
  authors: "作者一、作者二等"
  venue: "会议 / 期刊 · 年份"
  url: ""
  pdf: ""
  code: ""
  project: ""
  subjects: [] # 原论文的研究领域，与博客 tags 分开保留
  takeaway: "用三四句话概括研究问题、核心做法和主要结果。"
  abstract: "粘贴论文原文摘要。"
---

<!-- raw 导入：只参考本模板的章节组织，使用普通 Markdown 和 attachments/ 相对图片。
     也可直接复制到 _posts/YYYY-MM-DD-slug.md，填写上方信息；无需经过原始笔记转换器。
     pdf 填可跨域访问的 HTTPS 地址或本站 PDF 路径。发布前必须按 .agents/skills/anti-defensive-writing/SKILL.md 通读审校全文，
     包括简介、takeaway 和图注；审校后再设置 published: true。 -->
{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

用连贯段落说明研究问题、已有方法与本文的切入点。

<aside class="paper-sidenote" markdown="1">
**阅读提示** 这里适合放术语解释、前置知识或个人批注。紧邻相关段落显示，不占用侧栏目录。
</aside>

补充任务设定、核心假设和适用范围。引用可使用 Markdown 脚注。[^source]

## 2. 核心贡献
{: #contributions }

1. 第一项贡献：说明相对已有方法改变了什么。
2. 第二项贡献：说明证据来自哪个实验或分析。
3. 第三项贡献：记录论文的其他主要贡献。

## 3. 方法
{: #method }

### 整体思路

先用一段话解释输入、输出和各模块的职责，再进入细节。

图片与 caption 使用下面的格式：替换路径与说明后，将代码块中的 HTML 放到正文中。图片存放在 `img/arxiv-论文编号/`；`alt` 描述画面，caption 解释读图结论并注明来源。图片随正文宽度缩放。

```html
<figure>
  <img src="/img/arxiv-论文编号/architecture.png"
       alt="视觉编码器与语言模型连接并预测动作 token 的流程"
       loading="lazy">
  <figcaption><strong>图 1 · 模型结构。</strong>
    说明模块关系和最值得关注的设计。来源：原论文 Figure 1。
  </figcaption>
</figure>
```

### 关键设计

说明设计选择及其原因。长公式单独成段，条件概率使用 `\mid`，避免竖线被 Markdown 解析为表格：

```latex
$$
\pi(a \mid o, l) = \sum_z \pi(a \mid o, z)\,p(z \mid o, l)
$$
```

### 数据与训练

记录论文给出的数据来源、规模、预处理、训练目标和训练设置。

## 4. 实验与证据
{: #evidence }

### 实验设置

记录任务、数据划分、评价指标、基线与对比条件。

### 主要结果

| 关注的问题 | 论文给出的证据 | 结果说明 |
| :--- | :--- | :--- |
| 方法是否有效？ | 指标、对比条件与原文位置 | 改进幅度及适用范围 |
| 哪个设计有效？ | 消融实验 | 各项设计的作用 |

### 补充观察（可选）

记录论文报告的失败案例、适用条件或后续方向，标明原文位置。

## 5. 相关工作
{: #discussion }

按论文中的相关工作，整理方法之间的联系和区别。

## 6. Insights · 思考与启示
{: #takeaways }

记录自己的阅读联想与研究问题，并用“阅读联想”等表述标明。由 agent 整理时保留作者已有的思考；新增分析仅在作者要求时补充。

## 参考与补充

[^source]: 作者，论文标题，年份。补充可公开访问的链接及具体章节或页码。

</div>
