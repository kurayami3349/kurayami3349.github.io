---
title: DexGraspVLA
date: 2025-11-19
categories: [论文笔记]
tags: [VLA]
description: 论文提出了一个基于视觉-语言-动作（VLA）框架的层次化灵巧抓取系统DexGraspVLA，利用了视觉大模型生成域不变特征，能够实现对物体的泛化抓取。
---

{% include paper_note_style.html %}

<div class="paper-note-container" markdown="1">
# Note

*   Comment: 26 pages, 12 figures
*   Project website：[https://dexgraspvla.github.io](https://dexgraspvla.github.io/)

***

### Meta Data

*   **Title:** DexGraspVLA: a vision-language-action framework towards general dexterous grasping (2025-05-22)

*   **Author:** Yifan Zhong; Xuchuan Huang; Ruochong Li; Ceyao Zhang; Yitao Liang

*   **ArXiv id:** arXiv:2502.20900

*   **DOI:** [10.48550/arXiv.2502.20900](https://doi.org/10.48550/arXiv.2502.20900)

*   **URL:** <https://arxiv.org/abs/2502.20900>

*   **Local Link:** [Zhong 等 - 2025 - DexGraspVLA A Vision-Language-Action Framework Towards General Dexterous Grasping.pdf](zotero://open-pdf/0_RJ8W45YI)

*   **Abstract:**\
    Dexterous grasping remains a fundamental yet challenging problem in robotics. A general-purpose robot must be capable of grasping diverse objects in arbitrary scenarios. However, existing research typically relies on restrictive assumptions, such as single-object settings or limited environments, leading to constrained generalization. We present DexGraspVLA, a hierarchical framework for general dexterous grasping in cluttered scenes based on RGB image perception and language instructions. It utilizes a pre-trained Vision-Language model as the high-level task planner and learns a diffusion-based policy as the low-level Action controller. The key insight to achieve robust generalization lies in iteratively transforming diverse language and visual inputs into domain-invariant representations via foundation models, where imitation learning can be effectively applied due to the alleviation of domain shift. Notably, our method achieves a 90+% success rate under thousands of unseen object, lighting, and background combinations in a “zero-shot” environment. Empirical analysis confirms the consistency of internal model behavior across environmental variations, thereby validating our design and explaining its generalization performance. DexGraspVLA also demonstrates free-form longhorizon prompt execution, robustness to adversarial objects and human disturbance, and failure recovery, which are rarely achieved simultaneously in prior work. Extended application to nonprehensile object grasping further proves its generality. Code, model, and video are available at dexgraspvla.github.io.

*   **Research Tags:**

    *   Computer Science - Artificial Intelligence
    *   Computer Science - Robotics



{% include pdf_embed.html file="https://arxiv.org/pdf/2502.20900" id="unique-id" %}

***

### **1. 研究背景与动机（Background & Motivation）**

*   **研究背景**：\
    灵巧抓取是机器人领域的基础性难题，现有方法存在两大局限：

    *   (1) 两阶段方法（先预测抓取姿态再规划动作）依赖精确标定且缺乏闭环反馈\[10-12]；
    *   (2) 端到端模仿学习或强化学习方法泛化性不足，难以应对物体多样性、环境干扰和多物体场景\[17-19,52-53]。

*   **研究动机**：\
    作者提出首个层级化视觉-语言-动作（VLA）框架，旨在解决**开放场景下的泛化灵巧抓取**，核心挑战是如何利用有限演示数据实现**跨物体、光照、背景**的零样本（zero-shot）适应\[1,3]。

***

### **2. 创新贡献（Contribution）**

1.  **理论方法**：首次将视觉-语言大模型（VLM）与扩散策略结合，构建任务规划-动作控制的分层框架。
2.  **模型架构**：提出基于DINOv2的域不变特征提取器，通过SAM/Cutie实现目标分割跟踪。
3.  **性能突破**：在1,287个未见过的物体-光照-背景组合中达到90.8%零样本抓取成功率\[Table 1]。
4.  **应用扩展**：框架可泛化至非抓取操作（如推-抓复合动作），成功率84.7%\[Table 4]。

***

### **3. 研究方法（Method）**

*   **模型架构**：
![fig1](/img/arxiv-2502.20900/SYR92SE2.png)

    *   **高层规划器**：预训练VLM（Qwen-VL）解析语言指令→生成目标边界框\[Fig.2]。
    *   **低层控制器**：DINOv2提取视觉特征→DiT模型预测多步动作（H=64），采用后退时域控制\[4.1节]。

*   **算法设计**：

    *   关键创新：通过VLM和SAM将原始输入转换为域不变表示（边界框+特征），缓解模仿学习的领域偏移\[4.1节]。
    *   动作生成：基于扩散模型（DDPM）添加噪声后去噪训练，使用Immiscible Diffusion优化\[Appendix A]。采用了后退水平控制策略，即在生成新动作块预测前仅执行前Ha个动作，从而增强实时响应能力。

*   **数据处理**：

    *   收集2,094条人类演示（36个物体），包含RGB图像、本体感知、目标掩码\[4.2节]。
    *   测试集含360个未见物体和9种干扰环境（照明/背景）\[5.1节]。

***

### **4. 实验设计与结果（Experiments & Results）**

#### 实验设置

*   **硬件**：RealMan机械臂+PsiBot六自由度手，RealSense D405C（腕部）+D435（头部）相机\[Fig.3]。

*   **基线方法**：

    *   DexGraspVLA（ViT-small）：替换DINOv2为可训练ViT
    *   DexGraspVLA（DINOv2-train）：放开DINOv2参数训练\[5.3节]。

*   **评估指标**：抓取成功率（10cm悬停20秒）、长时任务完成率（多步推理）。

#### 对比实验结果

*   主结果：单物体抓取成功率98.6%（ViT-small基线仅50.5%），多物体场景90.8%\[Table 1-2]。
*   公平性：所有对比实验在同一测试环境进行\[5.1节]。

#### 长时任务评测

*   **四种用户指令类型**：“清理桌面”“抓取所有瓶子”“抓取所有绿色物体”和“抓取所有食品”。
*   **评估指标**：任务阶段成功率，以及其他阶段指标。\[5.5节]

<!---->

*   **结果**：在四个长期任务下实现了89.6%的综合任务成功率，平均尝试次数略高于一次。\[Tab. 3]

#### 非夹取式抓取（Nonprehensile Grasping）实验

*   两段式抓取演示数据：机器人先push到桌子边缘，再执行物体抓取

<!---->

*   planner不变，额外训练controller
*   结果：实现了84.7%的综合泛化性能，对物体的外观、形状、物理性质以及环境光照条件鲁棒，显著超越基准方法。\[Tab. 4]

#### 消融实验

1.  **模块分析**：冻结DINOv2比可训练版本提升63.8%成功率，证明域不变特征有效性\[Table 2]。
![fig2](/img/arxiv-2502.20900/SF88D8ZA.png)

2.  **过程验证**：可视化显示不同环境下DINOv2特征和注意力图高度一致\[Fig.5]。

***

### **5. 相关工作（Related Work）**

*   **灵巧抓取**：

    *   两阶段方法依赖几何优化\[11-12]，端到端RL受限于仿真-现实鸿沟\[13-16]。
    *   相比传统模仿学习\[18-19]，本文利用VLM实现语义 grounding。

*   **VLA模型**：\
    区别于RT-X\[29]等端到端微调方案，分层设计保留大模型推理能力\[25,30]。

***

### **6. 总结与启示（Conclusion & Insight）**

#### （1）工作总览

提出DexGraspVLA框架，通过VLM规划器+扩散控制器的层级架构，解决开放场景灵巧抓取的泛化难题，在1,287个零样本测试中实现90%+成功率，并展示长时任务执行能力。

#### （2）领域启示

*   **方法论**：证明大模型特征（Dino feature）可桥接模仿学习的sim-to-real鸿沟\[5.4节]，并展现出强大的视觉鲁棒性。
*   **应用**：首次将VLA框架扩展至多指手灵巧操作\[Section 6]。

#### （3）批判性思考

*   **局限**：未集成触觉反馈，后续操作依赖视觉\[Section 6]。
*   **风险**：安全机制需加强（如碰撞检测）\[Appendix E]。

***

</div>