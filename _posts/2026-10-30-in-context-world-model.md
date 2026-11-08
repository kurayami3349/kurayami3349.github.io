---
layout: post
title: "ICWM：用自主交互历史识别当前机器人系统"
date: 2026-10-30 00:00:00 +0800
published: true
categories: [论文笔记]
tags: [VLA, ICL, 世界模型, 系统辨识]
description: "梳理 ICWM 的交互上下文、隐式系统辨识与动作生成，整理跨视角和形态变化下的实验结果。"
math: true
toc: true
paper:
  title: "In-Context World Modeling for Robotic Control"
  authors: "Siyin Wang, Junhao Shi, Senyu Fei, Zhaoyang Fu, Li Ji, Jingjing Gong, Xipeng Qiu"
  venue: "arXiv · 2026"
  url: "https://arxiv.org/abs/2606.26025"
  pdf: "https://arxiv.org/pdf/2606.26025v3"
  code: ""
  project: ""
  subjects: [cs.RO]
  takeaway: >-
    ICWM 将随机动作及其前后图像作为 VLA 的上下文，以共享主干隐式识别部署配置并生成任务动作。新配置通过更新输入上下文实现适配。LIBERO 新视角四套件平均成功率按表格计算为 33.75%，MV 为 29.875%，相对提升约 13%。
  abstract: >-
    Modern Vision-Language-Action (VLA) models often fail to generalize to novel setups, such as altered camera viewpoints or robot morphologies, because they are typically conditioned only on current observations and language instructions. By ignoring the underlying system configuration as a variable, these models implicitly assume a fixed execution context encountered during training, necessitating data-intensive fine-tuning for any new environment. In this work, we introduce In-Context World Modeling (ICWM), a framework that treats system identification as an in-context adaptation problem. ICWM enables robot policies to autonomously infer essential system variables from a short history of self-generated, task-agnostic interactions. Unlike traditional In-Context Learning that uses demonstrations to specify what task to perform, ICWM leverages the context window to understand how the system operates. By processing these interactions before task execution, the model implicitly captures the world dynamics of the current system, enabling adaptation to novel configurations without parameter updates. Extensive experiments in simulation and on real-world robot platforms demonstrate that ICWM significantly outperforms standard VLA baselines on novel camera viewpoints.
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

相机换了位置，同一条机械臂动作在图像里就会表现为另一种位移；夹爪安装了延长件，同一控制指令对应的末端位置也会变化。ICWM 把这类部署变化写成系统配置变量 $$\psi$$，包含相机视角、安装偏移和机器人形态。论文关注的问题是：机器人怎样通过一小段自主交互，获得当前配置下的动作—观测对应关系，再执行已经学过的操作任务？（§3，PDF 第 3–4 页）

作者把状态拆为部署期间稳定的 $$\psi$$ 与随任务变化的场景状态 $$\xi_t$$。当前图像 $$o_t$$ 提供物体和机械臂的位置关系，交互历史则补充“发出某个动作后，图像发生了什么变化”。因此，策略需要同时利用当前场景、语言目标和当前系统的响应规律。ICWM 的上下文承担系统辨识功能，任务目标仍由当前语言指令给出。

## 2. 核心贡献
{: #contributions }

- **把交互片段作为配置条件。** 每段上下文记录动作前图像、执行动作与动作后图像，让模型从变化中识别视觉与控制坐标之间的关系。
- **用同一个 VLA 完成隐式辨识与动作生成。** 上下文产生配置相关隐藏状态，动作预测读取这些状态；训练继续使用任务动作的负对数似然。
- **把适配放进部署前的自主探测。** 机器人先采集一次随机动作响应，执行任务时反复读取这个上下文池。论文在 LIBERO 新视角、UR5e 实机及形态变化条件下报告成功率。（§4–6）

## 3. 方法
{: #method }

### 从原图看完整输入输出

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2606.26025v3#page=4">查看原图</a> · <strong>原文 Figure 2 · 上下文与控制共用一个模型。</strong> 左侧缓冲区保存动作及其前后图像；中间虚线框重复 N 次，成为前缀；右侧接入当前图像和语言任务，生成并解码动作。绿色为视觉表示，灰色为文本 token，黄色为动作 token。来源：In-Context World Modeling for Robotic Control，arXiv:2606.26025v3，PDF 第 4 页。</p>

图 2 可以按“历史片段 → 当前问题 → 控制输出”阅读。历史写为

$$
\mathcal T=\{(o_i^s,a_i,o_i^e)\}_{i=1}^{N},\qquad
a_t\sim\pi_\theta\bigl(a_t\mid\Psi(\mathcal T),o_t,l\bigr).
$$

$$o_i^s$$ 和 $$o_i^e$$ 分别是片段起止图像，$$a_i$$ 是期间的机器人动作；$$o_t$$ 和 $$l$$ 是当前图像与任务指令。上下文的粒度是**带动作标记的视觉转移片段**，常用 $$N=5$$。图中两个历史图像经视觉编码器处理，历史动作经 FAST tokenizer 转为动作 token，再共同进入 Qwen2.5-VL-3B 主干。（§4，§5.1）

$$\Psi(\mathcal T)$$ 是模型处理历史后形成的隐藏状态，表达当前系统的视觉—动作映射。这个隐式世界模型的输入是交互前缀，输出是供策略使用的配置表示；整个 VLA 的最终输出则是动作 token 序列。图中动作反分词器将输出还原为 $$[\Delta x,\Delta\theta,\Delta\mathrm{Grip}]$$，即末端位置增量、旋转增量和夹爪动作，动作块长度为 5。配置推断与动作预测共享主干参数，在一次前向传播中完成连接。（Figure 2；§4.2、§5.1）

### 上下文能力如何在训练中学到

训练为每个任务查询前置 $$N$$ 个交互片段。片段池来自训练轨迹及训练视角，模型在不同配置下反复看到“交互响应 + 当前图像 + 指令 → 任务动作”的样本。上下文随配置变化，准确预测任务动作的监督信号推动模型读取其中的系统信息。训练目标为

$$
\mathcal L=-\log\pi_\theta\bigl(a_t\mid\Psi(\mathcal T),o_t,l\bigr).
$$

因此，ICL 能力来自具有交互前缀的动作预测训练。论文直接检验了这一点：把同样的交互 token 塞给普通 BC 训练的策略，成功率低于 1%；经历上下文训练的模型才学会如何使用这些片段。（§4.1、§6.1）

仿真训练数据通过回放 LIBERO 专家示范、从 8 个训练视角重新渲染得到，并过滤失败轨迹，以及动作范数接近零、夹爪静止的冗余帧。实机每项任务采集约 100–150 条遥操作示范。训练使用 8 张 A100、AdamW，权重衰减 $$10^{-4}$$，学习率经过 50k 步 warmup 达到 $$5\times10^{-5}$$，随后余弦衰减。（§5.1；附录 B.1、C.1）

### 部署时怎样采集、读取和复用历史

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2606.26025v3#page=22">查看原图</a> · <strong>原文 Figure 16 · 随机动作提供系统响应样本。</strong> 上排是真实场景，下排是仿真场景，每组展示起始帧 oˢ 与结束帧 oᵉ。上下文保留它们之间的动作标记，使模型将控制输入与视觉位移配对。来源：同文 v3，PDF 第 22 页。</p>

部署前，机器人在可达工作空间中随机采样目标，向目标执行固定步长运动，记录起止图像和动作。附录 D.1 将探测实现具体化为固定步长策略：动作目的在于产生覆盖不同方向的响应片段，执行过程允许在到达随机目标前结束。实机工作空间由 UR5e 关节范围与正向运动学确定，探测避开任务物体，保留原有任务布局。（§4.2；附录 D.1）

一次部署执行 **20 个探测动作，约耗时 5–6 秒**。随后每次推理从这 20 条记录中随机抽取 **5 个三元组**作为前缀；任务全程复用原上下文池。当前图像随执行更新，语言目标指明任务，模型重新根据所读前缀生成动作。（附录 D.1，PDF 第 22 页）

| 阶段 | 输入与处理 | 随阶段更新的量 |
| :--- | :--- | :--- |
| 训练 | 多配置下的交互前缀、当前图像、指令和专家动作 | 模型参数 $$\theta$$ |
| 部署前探测 | 自主动作与对应视觉响应 | 当前部署的上下文池 $$\mathcal T$$ |
| 任务执行 | 池中抽取的 5 个片段、最新图像、任务指令 | 输入前缀、隐藏表示、当前观测和输出动作；$$\theta$$ 固定 |

在 RTX 4090 上，0、3、5 个上下文片段对应单次推理时间为 0.112、0.165、0.185 秒。论文还提出对固定前缀的隐藏状态使用 KV cache，以复用上下文计算。（§6.4，Figure 10）

## 4. 实验与证据
{: #evidence }

### 设置与比较对象

LIBERO 包括 Spatial、Goal、Object、Long 四个任务套件。按附录 B.1 的完整划分，训练视角为 $$\{30,60,90,120,240,270,300,330\}^\circ$$，测试新视角为 $$\{45,135,225,255,285,315\}^\circ$$。指标为任务成功率。

核心对照 MV 使用与 ICWM 相同架构和多视角数据；EXP 在 MV 输入中加入真实相机角度文本。NORA、π-FAST、π0.5 是在单一视角微调的预训练模型，呈现另一种训练设置下的跨视角表现。实机使用 UR5e 与 Robotiq 2F-85，12 个相机视角分为 6 个训练、6 个测试；4 项任务、每任务每个新视角 25 次，共 600 次试验。（§5.1；附录 C.1）

### 主要结果：成功率与提升口径

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2606.26025v3#page=6">查看原图</a> · <strong>原文 Figure 4 · 已见与新视角的成功率。</strong> 纵轴为成功率（%），绿色为 ICWM。最右侧 +8.1% 与 +13.0% 表示相对 MV 的平均相对提升；对应新视角的原始成功率见下表。来源：同文 v3，PDF 第 6 页；数值核对 Table 3–4，第 17、19 页。</p>

| LIBERO 新视角 | MV 成功率 | EXP 成功率 | ICWM 成功率 | ICWM − MV |
| :--- | ---: | ---: | ---: | ---: |
| Spatial | 48.3% | 46.3% | 49.9% | +1.6 个百分点 |
| Goal | 38.7% | 41.5% | 44.2% | +5.5 个百分点 |
| Object | 12.7% | 15.3% | 15.9% | +3.2 个百分点 |
| Long | 19.8% | 20.2% | 25.0% | +5.2 个百分点 |
| 四套件均值¹ | 29.875% | 30.825% | 33.750% | +3.875 个百分点 |

¹ 由 Table 4 已舍入的套件均值计算。ICWM 相对 MV 提升约 **13.0%**，相对 EXP 约 **9.5%**；Long 的 19.8% → 25.0% 对应相对提升 **26.3%**。已见视角的 Goal 成功率为 MV 73.3%、ICWM 71.6%，其他三个套件的 ICWM 均值高于 MV。（Table 3–4）

实机 Figure 5 报告 ICWM 对 MV 的平均成功率**相对提升约 71%**；四项任务分别是将盒子上的玩具移入篮子、叠杯、提篮、将茄子移到红盘。语义扰动测试中，添加干扰物时为 35.0% 对 27.5%，更换桌面纹理时为 41.2% 对 37.5%。UR5e 夹爪延长 80 mm 时，ICWM 为 14.4%、MV 为 5.6%。（§5.3、§6.3，Figure 5、8）

WindowX 形态实验以原连杆长度的 100% 和 70% 训练，在 90% 和 80% 长度测试。两种测试形态下，ICWM/MV 分别为 **77%/57%** 和 **62%/28%**，对应 20 和 34 个百分点差距。（Figure 9；附录 C.2）

### 上下文消融解释了什么

Table 1 的六个新视角平均成功率为：完整上下文 **25.0%**，去动作 **21.6%**，去图像 **10.9%**，去整个上下文 **22.0%**，提供相差 180° 的错误视角上下文 **18.9%**。配对视觉结果与动作共同提供辨识信息；错误响应样本会改变策略的控制判断。这里的“去上下文”属于 ICWM 消融设置，独立训练的 MV 在同组视角为 19.8%。（Table 1–2）

Table 2 比较了不同探测方式：随机运动 25.0%，仅改变姿态 23.4%，仅竖直运动 22.8%，仅水平运动 24.9%，MV 为 19.8%。各方式均能提供可用的动作响应；具体优势随视角变化。Figure 7 的 t-SNE 将六种新视角各 1,024 个隐藏表示可视化，展示了同视角聚集、不同视角分离的表示结构。（§6.1–6.2）

## 5. 相关工作
{: #related-work }

ICRT [5] 通过观测—动作序列的 next-token prediction 学习上下文模仿，RICL [13] 研究为预训练 VLA 加入上下文适应，MimicDroid [6] 利用人类 play 视频。ICWM 延续序列条件策略的形式，把上下文内容组织为当前系统的自主动作响应，语言指令继续承担行为目标的指定。（§2.1）

世界模型研究包括预测未来像素的模型 [24–27]、预测潜在状态的模型 [28–32]、从视觉变化推断动作的逆动力学模型 [33–36]，以及联合视频与动作建模 [37,38]。ICWM 将“世界模型”实现为交互前缀诱导的隐藏表示，通过任务动作监督获得配置辨识能力。实现基础是 Qwen2.5-VL [43] 与 FAST 动作编码 [41]，评估任务来自 LIBERO [39]。（§2.2、§5.1）

## 6. Insights · 思考与启示
{: #takeaways }

### 批判性阅读：固定探测池能否跟上中途变化的物理条件？

部署时从既有探测池抽取上下文，能够识别探测时的系统特征。如果抓取位置、负载或接触约束在执行中改变，历史探测仍可能指向旧参数。增加同一旧池的查询次数，无法补充变化后的响应信息。

**区分实验。** 在相同当前观测下引入一次负载变化，以相同探测次数和运动预算比较复用旧池、替换近期样本和主动选择探测方向。分别记录变化后的首段预测误差与任务恢复时间，可区分记忆容量、信息新鲜度和探测激励是否充分。

### 进一步的阅读联系

**阅读联想：把历史当作系统信息来读。** 这篇工作的上下文指向部署配置，读者可以据此区分两类历史：任务历史帮助定位当前执行阶段，探测历史帮助解释同一动作在当前系统中会产生怎样的观测变化。两者能携带不同的隐变量信息。

**阅读联想：从视觉响应到力响应。** ICWM 以图像和动作组成上下文，在视角与形态变化中识别部署配置。沿着动作—响应配对的思路，动作—力历史可以提供接触条件的信息：相近运动在不同刚度、摩擦或装配间隙下对应不同力响应。

**由此形成的研究问题。** 视觉响应与力响应分别揭示哪些系统变量？部署前获得的历史与接触过程中持续积累的历史，分别适合表达多长时间尺度的条件？ICWM 将“模型权重中学到的适配方式”和“上下文中提供的当前条件”分开，使这些问题可以从输入信息与状态更新方式来理解。

## 参考与补充

- Wang, Siyin; Shi, Junhao; Fei, Senyu; Fu, Zhaoyang; Ji, Li; Gong, Jingjing; Qiu, Xipeng. **In-Context World Modeling for Robotic Control**. arXiv:2606.26025v3，2026-07-03。[论文](https://arxiv.org/abs/2606.26025) · [PDF](https://arxiv.org/pdf/2606.26025v3)。
- 方法定位：§3–4，第 3–5 页；模型与训练：§5.1、第 6 页；详细数据：附录 B–D、第 15–22 页。
- 结果定位：Table 1–2，第 8 页；Table 3，第 17 页；Table 4，第 19 页；实机 Figure 5，第 7 页；形态与时延 Figure 8–10，第 9 页。
- 原文编号 [5]：Fu et al., *ICRT: In-context imitation learning via next-token prediction*；[13]：Sridhar et al., *RICL: Adding in-context adaptability to pre-trained vision-language-action models*。
- 原文编号 [39]：Liu et al., *LIBERO*；[41]：Pertsch et al., *FAST: Efficient Action Tokenization for Vision-Language-Action Models*；[43]：Bai et al., *Qwen2.5-VL Technical Report*。

</div>
