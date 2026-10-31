---
layout: post
title: "Force Policy：以交互坐标系连接视觉策略与显式力位控制"
date: 2026-10-30 00:00:00 +0800
published: true
categories: [论文笔记]
tags: [机器人, 力控, 模仿学习, VLA]
description: "从动作与力反馈恢复交互坐标系，以 5 Hz 全局视觉和 50 Hz 局部力策略完成接触操作。"
math: true
toc: true
paper:
  title: "Force Policy: Learning Hybrid Force-Position Control Policy under Interaction Frame for Contact-Rich Manipulation"
  authors: "Hongjie Fang; Shirun Tang; Mingyu Mei; Haoxiang Qin; Zihao He; Jingjing Chen; Ying Feng; Chenxi Wang; Wanxi Liu; Zaixing He; Cewu Lu; Shiquan Wang"
  venue: "RSS · 2026"
  url: "https://arxiv.org/abs/2602.22088v2"
  pdf: "https://arxiv.org/pdf/2602.22088v2"
  code: ""
  project: "https://force-policy.github.io/"
  subjects: ["Computer Science - Robotics"]
  takeaway: "Force Policy 用交互坐标系表达接触方向，并让局部策略预测力位选择掩码、参考 wrench 与运动序列。5 Hz 全局视觉策略负责自由空间任务推进，50 Hz 局部策略负责接触调节，异步调度器保证动作衔接。翻转、充电枪插入、简单及困难刮贴纸的最终阶段得分分别达到 95%、65%、100% 和 90%。六种新物体上的成功次数合计为 23/30。"
  abstract: "Contact-rich manipulation demands human-like integration of perception and force feedback: vision should guide task progress, while high-frequency interaction control must stabilize contact under uncertainty. Existing learning-based policies often entangle these roles in a monolithic network, trading off global generalization against stable local refinement, while control-centric approaches typically assume a known task structure or learn only controller parameters rather than the structure itself. In this paper, we formalize a physically grounded interaction frame, an instantaneous local basis that decouples force regulation from motion execution, and propose a method to recover it from demonstrations. Based on this, we address both issues by proposing Force Policy, a global-local vision-force policy in which a global policy guides free-space actions using vision, and upon contact, a high-frequency local policy with force feedback estimates the interaction frame and executes hybrid force-position control for stable interaction. Real-world experiments across diverse contact-rich tasks show consistent gains over strong baselines, with more robust contact establishment, more accurate force regulation, and reliable generalization to novel objects with varied geometries and physical properties, ultimately improving both contact stability and execution quality. Project page: https://force-policy.github.io/"
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

插入充电枪、沿表面刮除贴纸和翻转物体，都包含“先到达，再建立接触，随后持续调节力”的过程。视觉提供目标位置、几何形状与任务进度；末端力反馈反映接触、阻力和滑动。Force Policy 围绕这两种信息的时间尺度组织策略：全局视觉策略负责接近目标，局部力策略负责接触后的快速调节。[§I、§IV-B]

论文将接触控制的核心问题写成三个相互关联的选择：**在哪个坐标系中控制、哪些方向控制力、各方向的目标力或运动是多少。** 作者从环境局部刚度出发定义 interaction frame（交互坐标系，IF），再从示范中的运动与力恢复其方向，最后让策略学习预测这套控制结构。[§III—IV]

## 2. 核心贡献
{: #contributions }

1. **以物理响应定义交互坐标系。** 环境刚度的主方向区分受约束方向和可运动方向，任务中的运动意图与施力意图进一步确定坐标轴；示范标注结合功率分解和视觉语义。[§III、§IV-A]
2. **将力控结构纳入策略输出。** 局部策略共同预测 IF、六维力／位选择掩码、参考 wrench 和运动序列，使学习结果直接对应混合力位控制器的参数。[§IV-B，式（6）]
3. **组合 5 Hz 全局视觉策略与 50 Hz 局部力策略。** 通过异步调度、轨迹时间对齐和连续规划，将全局动作与局部动作接入同一执行流。[Fig. 3、§IV-C]
4. **在真机接触任务中验证完整系统。** 四个评价条件的最终阶段得分分别为 95%、65%、100% 和 90%，并开展新物体泛化、IF 标注与调度器分析。[Table II、IV，Fig. 6—7]

## 3. 方法
{: #method }

### 整体思路：全局到达与局部交互

<figure>
  <img src="/img/arxiv-2602.22088/fig3-policy-scheduler.png" alt="Force Policy 的全局视觉策略、局部力策略及双策略异步调度器" loading="lazy">
  <figcaption><strong>原文 Fig. 3 · 双频率策略与执行接口。</strong> 全局策略输出动作及场景特征；局部策略输出运动与显式力控结构。右侧通过 DTW 将新动作块对齐到已执行轨迹。来源：Force Policy，arXiv v2，PDF 第 5 页。</figcaption>
</figure>

全局策略采用 RISE-2 [31]，以全局三维点云为输入，以 5 Hz 推理。在自由空间阶段，其动作直接推动任务；进入接触阶段后，其 512 维动作条件特征继续为局部策略提供任务意图与几何上下文。局部策略以 50 Hz 推理，读取腕部图像、末端位姿历史与六轴 wrench 历史，并接收最近一次全局特征。[§IV-B、Supp. III]

| 部分 | 输入 | 输出及职责 |
| :--- | :--- | :--- |
| 全局视觉策略 | 全局三维视觉观测 | 自由空间动作、512 维全局上下文 |
| 局部多模态编码器 | 腕部 RGB、末端位姿及 wrench 历史、全局上下文 | 融合局部交互状态与任务信息 |
| 交互结构头 | 融合特征 | IF、参考 wrench、六维选择掩码 |
| MIP 动作头 | 融合特征 | 未来相对运动动作块 |
| 调度器与控制器 | 两种策略输出及近期执行历史 | 时间对齐、模式切换、50 Hz 控制命令 |

局部策略的输出写为：

$$
a_t^{\mathrm{local}}=
\left(\Sigma_{t+1},\ S_{t+1},\ W^{\mathrm{ref}}_{t+1},\ \Delta s_{t+1:t+T_a}\right).
$$

其中，$\Sigma$ 指定 IF，$S\in\{0,1\}^6$ 对应三个平移与三个旋转方向，1 表示力控制，0 表示位置控制。$W^{\mathrm{ref}}$ 给出六维参考力／力矩，$\Delta s$ 给出运动序列。例如表面交互使用 $S=[0,0,1,0,0,0]$，沿 IF 的 $z$ 轴维持法向力，其余轴执行运动目标。插入模式使用 $S=[0,1,1,0,1,1]$，使相应横向约束方向服从零参考 wrench。[Table I、式（6）]

选择掩码同时承担路由作用：预测出现激活的力控轴时，局部策略获得控制权；自由空间由全局策略执行。调度器通过滞回抑制切换抖动。[§IV-B—C]

### 交互坐标系：从动作—力响应恢复控制方向

<figure>
  <img src="/img/arxiv-2602.22088/fig2-interaction-frame.png" alt="抛光、插入、翻箱、拧螺丝和刮贴纸中的交互坐标系与约束方向" loading="lazy">
  <figcaption><strong>原文 Fig. 2 · 接触任务的交互坐标系。</strong> 红色表示施力和约束方向，绿色表示运动方向；同一套表示随接触几何和任务意图变化。来源：Force Policy，arXiv v2，PDF 第 3 页。</figcaption>
</figure>

理论分析针对局部保守、接触拓扑保持的接触过程。作者对局部对称刚度矩阵进行谱分解：较大特征值对应受约束子空间，近零特征值对应可运动子空间。随后用任务意图消除坐标系方向的歧义：$z$ 轴沿主要施力意图，$x$ 轴沿运动意图在 $z$ 轴正交平面中的投影，再按右手规则补全坐标系。实际标注将 IF 原点锚定在末端位置。[§III-A、§IV-A]

示范记录的 wrench $W$ 与 twist $\xi$ 同时包含任务意图和接触引起的附加响应。论文将观测功率分解为两类：摩擦等引起的**耗散残差**，以及弹性形变等引起的**结构残差**。两种主导情形使用不同的恢复方式：[§III-B，式（3）—（4）]

$$
\begin{aligned}
\text{结构残差主导：}\quad &W^*\approx W,\qquad
\xi^*\approx\xi-\operatorname{Proj}_{W}(\xi),\\
\text{耗散残差主导：}\quad &\xi^*\approx\xi,\qquad
W^*\approx W-\operatorname{Proj}_{\xi}(W).
\end{aligned}
$$

例如刮贴纸时，沿刮动方向测得的力包含摩擦，运动方向为恢复法向施力意图提供线索；压下刮刀时，工具形变产生的结构响应又更突出。作者给 Gemini 3 Pro [27] 输入片段起始视觉上下文和任务描述，判断主导功率来源，再用对应公式产生 IF 标签。这个步骤属于示范预处理；部署中的 IF 由局部策略预测。[§IV-A、§V-C]

### 局部网络、数据与训练

腕部图像经 ResNet-18 [35] 编码为 128 维特征，末端位姿与 wrench 历史经 GRU [21] 编码为另一个 128 维特征。位姿使用位置加连续旋转表示，共 9 维；wrench 包含三维力和三维力矩，共 6 维。全局特征通过 FiLM [65] 调制视觉编码器及 GRU 的输入、输出投影。三路特征随后通过自适应门控融合。[Supp. III]

交互结构头使用三层 MLP，输出相对末端的 IF 位姿、参考 wrench 与掩码。MIP [64] 头预测未来相对动作块；50 Hz 局部执行采用滚动时域方式，每次执行动作块的首步。训练先按照 RISE-2 官方实现训练全局策略，随后冻结全局策略，端到端训练局部策略。[Supp. III]

局部训练采用 AdamW、$10^{-4}$ 学习率和余弦退火。总损失包含动作预测、IF、参考 wrench 与掩码四项，权重依次为 1、1、1 和 0.1。前三项覆盖动作与交互参数回归，掩码项学习各轴控制模式。[Supp. III]

每项任务收集 50 条带真实力反馈的双臂遥操作示范 [56]。操作者通过主臂感受从臂交互力，RGB-D 以 15 Hz 记录，末端位姿、速度和力／力矩以 1000 Hz 记录。示范中的力信号经过重力补偿，平滑运动支持论文采用的惯性项近似。[§IV、Supp. V-B]

### 异步调度：把预测动作接到当前接触状态

调度器将两类策略动作插值到统一的 50 Hz，使用 DTW [59] 对齐新预测轨迹与近期执行历史。匹配代价结合位置、姿态和速度；对齐后选择动作块的进入位置，丢弃先于该位置的路点。DTW 计算耗时约 20 ms，实际再补偿 1—2 个控制步。之后通过加速度连续规划，将命令交给混合力位控制器 [79]。[§IV-C、Supp. IV-A]

这一步直接关系到接触的连续性：动作块之间的时间偏差可能让执行出现回退，轨迹对齐则使后续动作衔接当前任务进度。

## 4. 实验与证据
{: #evidence }

### 实验设置

真机平台包括 Flexiv Rizon 4、GN-02 夹爪、法兰六维力／力矩传感器，以及全局和腕部各一台 RealSense D415。任务为 Push and Flip、Plug in EV Charger、Scrape off Sticker 的 Easy／Hard 两种条件。充电枪完整插入约需 160 N，困难贴纸任务约需 35 N 刮除力。[§V-A、Supp. V-A]

对比包括 RISE-2 [31]、$\pi_{0.5}$ [8]、RDP [88]、FoAR [36]、ForceVLA [89] 和 TA-VLA [91]。各基线统一使用末端测量的六维力／力矩作为力输入输出，其余超参数沿用各自官方实现。论文在同一工作空间、预先生成的物体配置下评价；Push and Flip 各方法运行 20 次，其余条件运行 10 次。指标按任务阶段累计统计；翻转和插入阶段给部分完成计 0.5 分，因此表中百分数包含完成程度得分。[§V-A，Supp. V-D、I]

### 主要结果

| 方法 | 翻转最终阶段 | 充电枪插入最终阶段 | 贴纸 Easy 完整刮除 | 贴纸 Hard 完整刮除 |
| :--- | ---: | ---: | ---: | ---: |
| RISE-2 | 42.5% | 0% | 80% | 10% |
| $\pi_{0.5}$ | 52.5% | 0% | 70% | 20% |
| RDP | 57.5% | 5% | 70% | 20% |
| FoAR | 60% | 10% | 40% | 20% |
| ForceVLA | 30% | 0% | 0% | 0% |
| TA-VLA | 62.5% | 0% | 50% | 10% |
| **Force Policy** | **95%** | **65%** | **100%** | **90%** |

数据来自 Table II。Force Policy 的增益集中在需要持续施力和精确接触调节的阶段。充电枪任务中，其建立接触、匹配、插入三个阶段分别达到 100%、90%、65%；困难贴纸任务分别达到 100% 接触、90% 单侧刮除、90% 完整刮除。

<figure>
  <img src="/img/arxiv-2602.22088/fig5-force-tracking.png" alt="困难刮贴纸任务中，各策略有效接触力与示范力曲线对比" loading="lazy">
  <figcaption><strong>原文 Fig. 5 · 有效接触力随任务进度的变化。</strong> 灰色虚线表示示范；Force Policy 在刮除阶段逐步提高并维持作用力，接近示范的变化趋势。来源：Force Policy，arXiv v2，PDF 第 7 页。</figcaption>
</figure>

Push and Flip 另以约 20 kg 的重物作为过大推力的测量载体：示范翻转力约 15 N，推动重物约需 45 N。Force Policy 的重物平均位移为 0 cm，同时保持 95% 翻转得分。六种新物体各测试 5 次，Force Policy 分别成功 5、5、4、4、3、2 次，合计 23/30；$\pi_{0.5}$ 为 12/30，TA-VLA 为 11/30，RISE-2 为 6/30。物体变化覆盖颜色、几何与刚度。[Table III—IV]

### 消融与分析

IF 恢复实验在刮贴纸任务中比较估计力控轴与真实法向的夹角，以超过 20° 计为失败。自适应恢复方法的失败率为 3.6%，twist-only 为 4.0%，wrench-only 为 4.9%；以 wrench-only 标签训练的策略任务成功率为 50%，自适应标签训练为 90%。视觉语义分类在三项任务中的准确率分别为 100%、92%、98%。[Fig. 6、§V-C]

调度器分析使用轨迹平滑度 SPARC，数值越大表示越平滑。线性运动由 −4.515 提升至 −2.640，角运动由 −3.935 提升至 −2.967。把同一调度器接入视觉策略后，RISE-2 翻转得分由 42.5% 提升至 62.5%，$\pi_{0.5}$ 由 52.5% 提升至 77.5%。这些结果把策略表示和部署时序各自对接触执行的作用呈现出来。[Fig. 7、Supp. IV-B，Table V]

## 5. 相关工作
{: #related-work }

Force Policy 延续任务坐标系 TFF [12,57] 与混合力位控制 [67] 的思路：在合适的坐标系中，为不同轴分配力和运动目标。它进一步从交互响应恢复坐标系，并以学习策略同时预测坐标系和控制参数。与基于 wrench 方向 [25,53]、运动学 [62]、功率 [63] 或多模型拟合 [58] 的方法相比，其恢复过程按接触的结构／耗散来源选择近似。[§II、§III]

在力感知策略谱系中，RDP [88] 使用层级动作解码，FoAR [36] 研究力感知反应策略，ForceVLA [89] 和 TA-VLA [91] 将力相关信号用于 VLA。Force Policy 将全局视觉上下文与局部交互控制分配到两个频率，并让参考 wrench 和控制轴成为显式输出。本文实现的全局模型为 RISE-2；论文也将该接口描述为可接入既有视觉策略或 VLA 的模块化形式。[§II、§IV-B]

## 6. Insights · 思考与启示
{: #takeaways }

**动作—力历史可以对应一套具体的接触状态表示。** 论文用 IF、选择掩码与参考 wrench 表达“当前沿什么方向运动、沿什么方向施力”。对力位协同 ICL 的阅读联想是：历史交互提供的 context 可以组织为“动作—响应—控制结构”的序列，适配目标由此落到接触方向、控制模式和目标力的变化上。

**历史的时间尺度值得分开理解。** 本文通过 GRU 使用近期位姿与 wrench 历史，形成固定参数策略的在线反馈状态。沿此继续思考 ICL，可关注更早的试探动作如何影响后续控制结构预测：例如相同视觉下，先前触碰反映出的摩擦或柔顺性，如何持续参与后续施力决策。这里的跨尝试 context 是由论文接口引出的研究问题。

**策略输出和执行接口共同决定接触表现。** 原文调度器使 $\pi_{0.5}$ 的翻转得分提高 25 个百分点，说明动作块衔接本身就会改变接触稳定性。阅读这类力控基线时，可以把“模型预测了什么”与“控制器如何按时间执行”一并理解：前者给出物理目标，后者保证目标落到连续的接触过程。

## 参考与补充

发表信息：RSS · 2026。[来源](https://www.roboticsproceedings.org/rss22/p128.html)。

- 论文：Hongjie Fang 等，*Force Policy: Learning Hybrid Force-Position Control Policy under Interaction Frame for Contact-Rich Manipulation*，2026。[arXiv v2](https://arxiv.org/abs/2602.22088v2) · [PDF](https://arxiv.org/pdf/2602.22088v2) · [项目页](https://force-policy.github.io/)。本笔记依据 2026-05-09 版本。
- 方法定位：§III 交互坐标系与信号恢复；§IV-A 控制标签；§IV-B 模型输入输出；§IV-C 调度器；Supp. III 网络与训练；Supp. IV 调度细节。
- 实验定位：Table II 主结果；Table III 力调节；Table IV 新物体；Fig. 6—7 消融；Table V 调度器迁移；Supp. V 数据、任务与计分。
- 文中方括号编号沿用原论文 References，便于对应 RISE-2 [31]、FoAR [36]、MIP [64]、RDP [88]、ForceVLA [89] 与 TA-VLA [91]。

</div>
