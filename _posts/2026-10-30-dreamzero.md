---
layout: post
title: "DreamZero：用视频—动作联合生成获得零样本机器人策略"
date: 2026-10-30 00:00:00 +0800
published: true
categories: [论文笔记]
tags: ["WAM", "机器人基础模型", "泛化"]
description: "解释 DreamZero 的联合 flow matching、真实观测更新、跨 embodiment 视频迁移及实时推理，并区分任务进度与成功率。"
math: true
toc: true
paper:
  title: "World action models are zero-shot policies"
  authors: "Seonghyeon Ye; Yunhao Ge; Kaiyuan Zheng; Shenyuan Gao; Sihyun Yu; George Kurian; Suneel Indupuru; You Liang Tan; Chuning Zhu; Jiannan Xiang; Ayaan Malik; Kyungmin Lee; William Liang; Nadun Ranawaka; Jiasheng Gu; Yinzhen Xu; Guanzhi Wang; Fengyuan Hu; Avnish Narayan; Johan Bjorck; Jing Wang; Gwanghyun Kim; Dantong Niu; Ruijie Zheng; Yuqi Xie; Jimmy Wu; Qi Wang; Ryan Julian; Danfei Xu; Yilun Du; Yevgen Chebotar; Scott Reed; Jan Kautz; Yuke Zhu; Linxi \"Jim\" Fan; Joel Jang"
  venue: "CoRL 2026 · 已接收"
  url: "https://arxiv.org/abs/2602.15922v1"
  pdf: "https://arxiv.org/pdf/2602.15922v1"
  code: "https://github.com/dreamzero0/dreamzero"
  project: "https://dreamzero0.github.io/"
  subjects: ["Computer Science - Robotics"]
  takeaway: "DreamZero 从 14B 视频生成骨干出发，联合学习未来视频与机器人动作，并用真实观测持续更新自回归上下文。在 AgiBot 未见任务上平均任务进度达到 39.5%，预训练 VLA 对照为 16.3%。少量人类或其他机器人视频经后训练提升跨任务表现，Flash 与系统优化实现约 150 毫秒的动作块生成。"
  abstract: "State-of-the-art Vision-Language-Action (VLA) models excel at semantic generalization but struggle to generalize to unseen physical motions in novel environments. We introduce DreamZero, a World Action Model (WAM) built upon a pretrained video diffusion backbone. Unlike VLAs, WAMs learn physical dynamics by predicting future world states and actions, using video as a dense representation of how the world evolves. By jointly modeling video and action, DreamZero learns diverse skills effectively from heterogeneous robot data without relying on repetitive demonstrations. This results in over 2x improvement in generalization to new tasks and environments compared to state-of-the-art VLAs in real robot experiments. Crucially, through model and system optimizations, we enable a 14B autoregressive video diffusion model to perform real-time closed-loop control at 7Hz. Finally, we demonstrate two forms of cross-embodiment transfer: video-only demonstrations from other robots or humans yield a relative improvement of over 42% on unseen task performance with just 10-20 minutes of data. More surprisingly, DreamZero enables few-shot embodiment adaptation, transferring to a new embodiment with only 30 minutes of play data while retaining zero-shot generalization."
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

DreamZero 把预训练视频模型转化为能够执行语言指令的机器人策略。视频生成预训练提供物体运动、交互过程和场景变化的先验，机器人数据再把这些视觉变化与动作对应起来。论文围绕三个问题展开：未来视频与动作如何联合建模，生成模型如何进入实时闭环，以及视觉经验如何跨任务、跨机器人迁移。[^paper]

任务输入包括语言指令、当前与历史视觉观测、本体状态；输出包括未来视频和一个动作块。论文中的 zero-shot 指已训练模型在未见任务上的直接执行，跨 embodiment 视频迁移和新机器人适配则分别通过后续训练完成。

## 2. 核心贡献
{: #contributions }

1. 用 14B 视频扩散骨干联合生成视频与动作，通过同一组 Transformer 层建立未来场景与控制指令的联系。
2. 将自回归视频建模接入机器人闭环：实际执行后，把真实观测写回 KV cache，持续更新预测的起点。
3. 结合系统优化与 DreamZero-Flash 训练，将动作块生成时间从约 5.7 秒降至约 150 毫秒，并展示少量跨机器人、人类视频带来的任务迁移。

## 3. 方法
{: #method }

### 联合生成未来视频和动作

模型以 Wan2.1-I2V-14B-480P 为初始化。视觉经 VAE 编码，语言和本体状态经各自编码器输入，动作通过新增的 action encoder 和 decoder 进入共享 DiT。多视角图像在视觉输入中拼接。未来视频与动作共同加噪、共同进行 flow matching；训练时，过去块提供干净的条件，当前块学习去噪。

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2602.15922v1#page=6">查看原图</a> · <strong>原文 Fig. 4 · 联合训练与真实观测闭环。</strong> 左侧使用干净历史进行 teacher forcing，右侧在每轮执行后更新实际视觉历史。 来源：DreamZero，arXiv v1，PDF 第 6 页。</p>

论文将联合分布写为视频预测与逆动力学的分解：

$$
\pi(o_{t:t+H},a_{t:t+H}\mid o_{0:t},c,q_t)
=p(o_{t:t+H}\mid o_{0:t},c,q_t)\,
p(a_{t:t+H}\mid o_{0:t+H},q_t).
$$

实际网络在同一次联合生成中实现两种能力。视频给出操作后场景如何变化，动作表示实现这种变化所需的控制序列。执行过程中，预测画面由新采集的真实画面替换，KV cache 因而保存机器人实际经历的视觉历史。

### 时间和动作对齐

视频采样频率为 5 FPS；AgiBot 动作为 30 Hz，DROID 动作为 15 Hz。两者每个动作块都覆盖 1.6 秒，分别对应 48 和 24 个动作。每块含两个视频 latent frame，四块上下文最多覆盖八个 latent frame，即 33 个原始视频帧、约 6.6 秒。动作使用相对关节位置，数据预处理移除静止片段。这些设置把不同频率的视觉与控制信号对齐到共同的物理时间窗口。（附录 C）

### 数据与训练阶段

| 阶段 | 数据与目标 | 模型变化 |
| :--- | :--- | :--- |
| 机器人预训练 | AgiBot 约 500 小时、多环境多任务数据；Franka 使用 DROID，分别训练 | 联合视频—动作 flow matching，更新 DiT 与状态/动作模块，冻结文本、图像编码器及 VAE |
| 特定任务后训练 | 叠衣 33 小时、分水果 12 小时、收桌 40 小时 | 各任务训练 50k 步 |
| 跨 embodiment 视频迁移 | 九项任务各八条示范，YAM 视频约 20 分钟或人类视频约 12 分钟 | 新视频与原机器人数据按 1:1 混合训练 10k 步；前者使用视频目标，后者使用联合目标 |
| 新机器人适配 | YAM 的 55 条、11 项任务轨迹，约 30 分钟 play 数据 | 后训练获得新机器人的动作映射 |

AgiBot 数据来自 22 个环境、7,193 个 episode，平均每条轨迹 4.4 分钟、42.4 个子任务。AgiBot 和 DROID 预训练均使用 100k 步、全局 batch 128。比较中的 VLA 使用同一批机器人数据继续训练，并对齐训练步数和 batch。（§4.1）

### 实时执行与 Flash

推理优化包括双 GPU 并行 classifier-free guidance、DiT 特征缓存、编译与 CUDA graph、算子优化以及 Blackwell 上的 NVFP4。DreamZero-Flash 进一步解耦视频和动作的噪声时间：视频训练输入偏向高噪声，动作覆盖完整噪声范围，让单步动作生成能够利用粗略的未来视觉信息。两张 GB200 上约 150 毫秒生成一个动作块，对应约 7 Hz 的块生成频率；AgiBot 底层仍按 30 Hz 执行动作。

## 4. 实验与证据
{: #evidence }

### 任务与评价

AgiBot 分别评价十项已见任务和十项未见任务，每项八次、分布在四台机器人上。DROID 分别评价二十项已见任务和二十项未见任务，每项两次。任务进度按完成步骤计分；完整成功率统计整项任务完成。场景和物体默认来自新测试环境。（§4.1、§4.2）

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2602.15922v1#page=14">查看原图</a> · <strong>原文 Fig. 9 · 未见任务上的进度与成功率。</strong> AgiBot 的 39.5% 为平均任务进度；右下角单列 DROID 的完整成功率。 来源：DreamZero，arXiv v1，PDF 第 14 页。</p>

| 实验问题 | 设置与指标 | 结果 | 原文位置 |
| :--- | :--- | :--- | :--- |
| 已见技能在新环境中的表现 | AgiBot，平均任务进度 | DreamZero 62.2%，最佳预训练 VLA 27.4% | Fig. 8 |
| 未见任务直接执行 | AgiBot，平均任务进度 | 39.5%，最佳预训练 VLA 16.3% | Fig. 9 |
| Franka 上的未见任务 | DROID，任务进度 / 完整成功率 | DreamZero 49% / 22.5%；GR00T N1.6 为 31% / 12.5%；π0.5 为 33% / 7.5% | Fig. 9 |
| 跨 embodiment 视频迁移 | 九项任务，平均任务进度 | 原模型 38.3%；人类视频后训练 54.3%；YAM 视频后训练 55.4% | Table 2 |
| 快速动作生成 | 收桌任务，任务进度 / 生成延迟 | 四步 83% / 350 ms；普通一步 52% / 150 ms；Flash 一步 74% / 150 ms | Table 3 |

跨 embodiment 实验中，54.3% 相对 38.3% 增加 16.0 个百分点，对应约 42% 相对提升；YAM 视频对应增加 17.1 个百分点。新 YAM 适配则用约 30 分钟机器人数据后训练，并展示新物体与语言指令下的执行结果。

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2602.15922v1#page=16">查看原图</a> · <strong>原文 Fig. 12 · 新机器人上的少量数据适配。</strong> 模型通过约 30 分钟 YAM play 数据后训练获得新 embodiment 的执行能力。 来源：DreamZero，arXiv v1，PDF 第 16 页。</p>

### 数据多样性与模型规模

Table 4 在统一的 50k 步、batch 32 下比较设计：500 小时重复任务数据对应 33% 任务进度，500 小时多样数据对应 50%；5B 与 14B 分别为 21% 和 50%。自回归与双向模型在该设置下均达到 50%，自回归模型产生更平滑的动作，并提供约 3–4 倍推理加速。

## 5. 相关工作
{: #related-work }

Wan（Team Wan, 2025）提供视频生成初始化；DROID（Khazatsky et al., 2024）提供跨场景机器人数据。GR00T N1.6（Bjorck et al., 2025）和 π0.5（Physical Intelligence, 2025）作为 VLA 比较方法，以视觉语言预训练连接动作学习。DreamZero 的核心区别是把未来视频纳入动作模型的训练和推理，使视频生成的动态先验直接参与控制。原文 §2 还将统一序列建模扩展到未来力与触觉等信号的可能性列为讨论方向。

## 6. Insights · 思考与启示
{: #takeaways }

### 批判性阅读：连贯的预测未来是否也是可执行的未来？

联合预测视频与动作建立了二者的统计联系。接触遮挡或材料变化时，外观连贯的未来仍可能要求当前机器人无法产生的力或运动。用真实观测覆盖缓存能抑制累计漂移，但两次刷新之间仍存在依赖预测的动作窗口。

**区分实验。** 固定动作头和推理预算，改变真实观测刷新间隔，并对同一初始状态构造外观相近、接触条件不同的场景。分别记录视觉误差、接触失败和纠错延迟，可区分未来生成质量与闭环反馈的贡献。

### 进一步的阅读联系

**阅读联想：context 可以保存已发生的交互，也可以参与预测接下来会发生的交互。** DreamZero 的在线历史由真实视觉观测持续更新，未来视频与动作在同一模型中生成。对应力位协同问题，可以沿这条结构关系理解“历史动作—力响应”：历史用于推断当前接触状态，未来响应用于组织后续控制。论文为这种联合建模提供了视觉实例。

**阅读联想：适配的发生位置值得单独记录。** 本文的未见任务执行来自预训练后的固定策略，跨 embodiment 视频通过梯度更新迁移，新机器人通过后训练获得动作接口，而当前环境的变化通过在线视觉历史进入模型。把训练获得的先验、部署时的历史条件和任务示范分别写清，有助于比较 WAM 与示范驱动 ICL 的能力来源。

## 参考与补充

发表信息：CoRL 2026 · 已接收。[来源](https://ut-austin-rpl.github.io/publications/2026/02/17/ye-arxiv26-dreamzero/)。

[^paper]: *World Action Models are Zero-shot Policies*, arXiv:2602.15922v1，2026。[论文](https://arxiv.org/abs/2602.15922v1) · [项目](https://dreamzero0.github.io/) · [代码](https://github.com/dreamzero0/dreamzero)。方法见 §3，训练与评估见 §4，时间配置见附录 C；图表引用沿用原文编号。

</div>
