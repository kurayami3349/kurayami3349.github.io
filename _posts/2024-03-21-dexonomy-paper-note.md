---
title: Dexonomy论文笔记
date: 2024-03-21
categories: [论文笔记]
tags: [机器人, 抓取]
description: Dexonomy 论文笔记：按照抓取分类体系合成多类型灵巧抓取，并构建大规模抓取数据集。
layout: post
math: true
toc: true
paper:
  title: "Dexonomy: synthesizing all dexterous grasp types in a grasp taxonomy"
  authors: "Jiayi Chen, Lin Peng, He Wang"
  venue: "RSS 2025"
  url: "https://arxiv.org/abs/2504.18829"
  pdf: "https://arxiv.org/pdf/2504.18829"
  subjects: ["Computer Science - Computer Vision and Pattern Recognition", "Computer Science - Robotics"]
  abstract: "Generalizable dexterous grasping with suitable grasp types is a fundamental skill for intelligent robots. Developing such skills requires a large-scale and high-quality dataset that covers numerous grasp types (i.e., at least those categorized by the GRASP taxonomy), but collecting such data is extremely challenging. Existing automatic grasp synthesis methods are often limited to specific grasp types or object categories, hindering scalability. This work proposes an efficient pipeline capable of synthesizing contact-rich, penetration-free, and physically plausible grasps for any grasp type, object, and articulated hand. Starting from a single human-annotated template for each hand and grasp type, our pipeline tackles the complicated synthesis problem with two stages: optimize the object to fit the hand template first, and then locally refine the hand to fit the object in simulation. To validate the synthesized grasps, we introduce a contact-aware control strategy that allows the hand to apply the appropriate force at each contact point to the object. Those validated grasps can also be used as new grasp templates to facilitate future synthesis. Experiments show that our method significantly outperforms previous type-unaware grasp synthesis baselines in simulation. Using our algorithm, we construct a dataset containing 10.7k objects and 9.5M grasps, covering 31 grasp types in the GRASP taxonomy. Finally, we train a type-conditional generative model that successfully performs the desired grasp type from single-view object point clouds, achieving an 82.3% success rate in real-world experiments."
  project: "https://pku-epic.github.io/Dexonomy/"
  takeaway: "Dexonomy 将抓取类型作为合成条件，通过“先让物体适配手部模板，再微调手部”的两阶段过程构建多类型抓取数据。当前笔记基于摘要整理，实验细节与相关工作仍待阅读全文核对。"
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

灵巧抓取不仅要求抓稳物体，还需要根据任务选择合适的抓取类型。覆盖多种抓取类型的大规模高质量数据难以采集，而已有自动合成方法往往局限于少数类型或物体。

## 2. 核心贡献
{: #contributions }

1. 从每种手型、抓取类型的一份人工模板出发，合成接触丰富、无穿透的抓取。
2. 构建覆盖 GRASP taxonomy 中 31 种类型的数据集，包含 10.7k 个物体和 9.5M 个抓取。
3. 训练以抓取类型为条件的生成模型，从单视角物体点云预测抓取。以上信息来自论文摘要。

## 3. 方法
{: #method }

### 整体思路

首先优化物体以适配手部模板，再在仿真中局部调整手部以适配物体。

### 接触验证

使用接触感知控制，为各接触点施加适当作用力。通过验证的抓取还可作为新模板，继续扩展合成过程。具体优化目标与控制参数待阅读全文补充。

## 4. 实验与证据
{: #evidence }

摘要报告类型条件模型在真实实验中的成功率为 82.3%，并指出仿真表现优于不区分抓取类型的合成基线。实验对象、试验次数、分类型指标与消融结果尚未整理，不能仅凭这一总体数字判断所有抓取类型的表现。

## 5. 相关工作与我的判断
{: #discussion }

从摘要看，本文的区别在于显式覆盖抓取分类体系，而非只追求不区分类型的抓取成功率。具体基线与公平性分析待阅读全文后补充。

## 6. Insights · 思考与启示
{: #takeaways }

抓取类型可以作为连接任务意图、数据合成与策略学习的中间表示。值得继续追问：分类体系是否覆盖实际任务需要？人工模板与仿真验证会引入哪些偏差？这些问题是阅读后的研究线索，尚不能由摘要回答。

## 参考与补充

本文沿用原笔记中的引用编号，编号、图表与章节均指向[原论文](https://arxiv.org/abs/2504.18829)。

</div>
