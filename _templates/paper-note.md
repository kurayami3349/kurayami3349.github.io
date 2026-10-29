---
layout: post
title: "论文简称：一句话概括核心问题"
date: 2026-10-29 00:00:00 +0800
published: false
categories: [论文笔记]
tags: [VLA]
description: "用一两句话说明笔记重点。"
math: true
toc: true
paper:
  title: "论文完整标题"
  authors: "作者一、作者二等"
  venue: "会议 / 期刊 · 年份"
  url: ""
  pdf: ""
  code: ""
  project: ""
  subjects: []
  takeaway: >-
    用三四句话概括论文解决的问题、核心方法与主要结果。
  abstract: >-
    粘贴论文原文摘要。
---

<!-- 写作约定：正文直接陈述论文的方法、设置与结果，具体结论附原文位置。
     阅读联想与研究问题集中在 Insights。相关工作说明方法联系与区别。
     章节按论文内容组织；可合并空缺小节。迁移笔记保留原有博客 tags。
     raw 导入使用普通 Markdown 与 attachments/ 相对图片；博客稿使用 /img/ 路径。
     发布前必须使用 .agents/skills/anti-defensive-writing/SKILL.md 审校全文，
     覆盖标题、简介、takeaway、正文和图注；原文摘要作为引用保留。
     agent 整理时保留已有思考，新增判断须有作者明确要求。 -->
{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

说明任务背景、论文关注的问题与切入点。

## 2. 核心贡献
{: #contributions }

概括论文的主要方法设计及其实现的能力。

## 3. 方法
{: #method }

### 整体思路

说明输入、输出、模块职责和处理流程。多阶段方法用表格说明各阶段的数据、目标与产物。

| 阶段 | 数据与输入 | 训练目标 / 处理过程 | 产物 |
| :--- | :--- | :--- | :--- |
| 阶段一 | 数据来源与输入 | 本阶段完成什么 | 输出供谁使用 |
| 阶段二 | 新增或复用的数据 | 与前一阶段如何衔接 | 最终输出 |

### 关键设计

解释关键模块如何工作，结合原图、公式和具体例子展开。

图片放在 `img/arxiv-论文编号/`。替换以下路径与图注后，将 HTML 放入正文：

```html
<figure>
  <img src="/img/arxiv-论文编号/architecture.png" alt="描述图中内容" loading="lazy">
  <figcaption><strong>原文 Fig. 1 · 图的主题。</strong> 解释图中机制或结果。来源：论文标题、版本与页码。</figcaption>
</figure>
```

长公式单独成段，条件概率使用 `\mid`：

```latex
$$
\pi(a \mid o, l) = \sum_z \pi(a \mid o, z)\,p(z \mid o, l)
$$
```

### 数据与训练

记录数据来源、表示、预处理、训练目标和具体设置。

## 4. 实验与证据
{: #evidence }

### 实验设置

说明任务、硬件、数据划分、指标含义和比较方法。

### 主要结果

| 实验问题 | 设置与指标 | 结果 | 原文位置 |
| :--- | :--- | :--- | :--- |
| 实验关注什么 | 任务与对比条件 | 具体数值与结论 | 表格、图或章节 |

### 消融与分析

按论文中的实验说明各项设计的作用，以及不同条件下的结果。

## 5. 相关工作
{: #related-work }

说明论文与相关方法的联系、继承和设计区别，保留原文参考文献编号。

## 6. Insights · 思考与启示
{: #takeaways }

集中记录阅读联想、对已有问题的理解变化，以及由此产生的研究问题。用“论文结果”“阅读联想”等自然表述交代观点来源。

## 参考与补充

列出论文版本、项目和代码链接，以及笔记引用的章节、页码、图表与关键文献。

</div>
