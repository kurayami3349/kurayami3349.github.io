---
title: Dexonomy论文笔记
date: 2024-03-21
categories: [论文笔记]
tags: [机器人, 抓取]
description: Short summary of the post.
---

{% include paper_note_style.html %}

<div class="paper-note-container" markdown="1">

# Dexonomy: 抓取分类系统中所有灵巧抓取类型的合成

> Accepted by Robotics: Science and Systems (RSS 2025)
>
> Project website: [https://pku-epic.github.io/Dexonomy/](https://pku-epic.github.io/Dexonomy/)

<div class="meta-data" markdown="1">
### Meta Data

* **标题：** Dexonomy: synthesizing all dexterous grasp types in a grasp taxonomy
* **作者：** Jiayi Chen, Lin Peng, He Wang
* **发表时间：** 2025-04-26
* **会议：** RSS 2025
* **ArXiv ID：** arXiv:2504.18829
* **DOI：** [10.48550/arXiv.2504.18829](https://doi.org/10.48550/arXiv.2504.18829)
* **论文链接：** [https://arxiv.org/abs/2504.18829](https://arxiv.org/abs/2504.18829)

**研究领域：**
* Computer Science - Computer Vision and Pattern Recognition
* Computer Science - Robotics

**摘要：**  
Generalizable dexterous grasping with suitable grasp types is a fundamental skill for intelligent robots. Developing such skills requires a large-scale and high-quality dataset that covers numerous grasp types (i.e., at least those categorized by the GRASP taxonomy), but collecting such data is extremely challenging. Existing automatic grasp synthesis methods are often limited to specific grasp types or object categories, hindering scalability. This work proposes an efficient pipeline capable of synthesizing contact-rich, penetration-free, and physically plausible grasps for any grasp type, object, and articulated hand. Starting from a single human-annotated template for each hand and grasp type, our pipeline tackles the complicated synthesis problem with two stages: optimize the object to fit the hand template first, and then locally refine the hand to fit the object in simulation. To validate the synthesized grasps, we introduce a contact-aware control strategy that allows the hand to apply the appropriate force at each contact point to the object. Those validated grasps can also be used as new grasp templates to facilitate future synthesis. Experiments show that our method significantly outperforms previous type-unaware grasp synthesis baselines in simulation. Using our algorithm, we construct a dataset containing 10.7k objects and 9.5M grasps, covering 31 grasp types in the GRASP taxonomy. Finally, we train a type-conditional generative model that successfully performs the desired grasp type from single-view object point clouds, achieving an 82.3% success rate in real-world experiments.
</div>

{% include pdf_embed.html file="https://arxiv.org/pdf/2504.18829" id="unique-id" %}

## 1. 研究背景与动机

在这里描述论文的研究背景和动机。

## 2. 创新贡献

列举论文的主要贡献点。

## 3. 研究方法

### 模型架构

描述模型的整体架构。

### 算法设计

详细的算法设计和实现。

### 数据处理

数据处理和预处理方法。

## 4. 实验设计与结果

### 实验设置

描述实验环境和参数设置。

### 对比实验结果

主要的对比实验结果。

### 消融实验

消融实验的设计和结果。

## 5. 相关工作

相关研究工作的总结和比较。

## 6. 总结与启示

### 工作总览

对论文工作的整体总结。

### 领域启示

对相关研究领域的启示。

### 批判性思考

个人对论文的思考和建议。

</div>