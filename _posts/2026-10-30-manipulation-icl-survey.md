---
layout: post
title: "示范驱动的机器人 ICL：context 信息、执行对应与交互适配"
date: 2026-10-30 00:00:00 +0800
published: true
categories: [论文笔记]
tags: ["ICL", "综述", "机器人操作"]
description: "按四个分析轴梳理任务向量、序列记忆、几何对应、检索、人类视频和交互历史，保留代表性实验的指标与条件。"
math: true
toc: true
paper:
  title: "In-context learning from demonstrations for robotic manipulation: a survey"
  authors: "Wenhao Li"
  venue: "Preprints.org · 2026"
  url: "https://www.preprints.org/manuscript/202609.0780/v1"
  pdf: ""
  code: ""
  project: ""
  subjects: ["embodied artificial intelligence", "in-context learning", "one-shot imitation learning", "robot learning", "vision-language-action models", "world action models"]
  takeaway: "本文以 context 信息、推断目标、适配机制和测试迁移四个轴连接机器人示范学习方法。几何结构提供空间对应，压缩任务表示保存意图，局部时序 context 支持阶段相关控制，人类视频通过配对、运动估计或机器人未来模型连接到执行。交互历史进一步提供动作响应，使固定参数策略能够利用当前环境的物理条件。"
  abstract: "A single demonstration can guide a robot toward a new goal, execution sequence, or object correspondence without updating its learned parameters. Yet “one demonstration” describes neither a common information budget nor a common learning problem. This survey examines demonstration-driven in-context learning for robotic manipulation through four axes: context information, inference target, adaptation mechanism, and evaluated transfer. It connects early conditional policies to geometric methods, retrieval, vision-language-action models, and world action models. Three findings organize the comparison. Geometric structure reduces the transformation that a policy must learn, while making perception and correspondence more consequential. Compressed task representations favor reusable intent, whereas detailed context supports stage-dependent control at greater inference cost. Human-video adaptation obtains executable correspondence from prior pairing, motion estimation, or robot-future models; the video alone does not provide the same information in each route. Representative method tables make these preparation requirements explicit, and benchmark evidence locates current strengths in task selection and structured transfer. The resulting research questions concern informative example selection, selective access during execution, and interaction that resolves correspondence uncertainty."
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

示范驱动的机器人 ICL 让部署中的机器人通过示例推断任务、执行方式或环境响应，同时保持已学习的参数固定。这条路线连接了早期 one-shot imitation、任务 embedding、几何对应、检索策略以及 VLA/WAM。本文以“示范提供了什么、系统已经学会了什么、测试改变了什么”为主线，分析不同方法怎样把例子变为可执行行为。[^survey]

作者把同样称为“一条示范”的输入进一步展开：普通 RGB 视频提供物体和运动过程，机器人轨迹还提供本体状态与动作，RGB-D、分割点云和带传感器的手持采集系统则提供额外几何信息。比较方法时，部署示例与已有训练、感知处理和控制接口共同决定实际的信息条件。

## 2. 核心贡献
{: #contributions }

1. 提出四维分析框架：context 信息、推断目标、适配机制、实际评价的迁移，把不同模型家族放入统一坐标。
2. 在两张代表性方法表中整理 21 种方法的输入、训练与传感器准备、动作生成和测试范围，连接条件策略、几何方法、检索与人类视频学习。
3. 汇集带版本及原文位置的实验对比，区分中间过程信息、示例数量、训练设计和交互反馈各自发挥的作用。

## 3. 方法
{: #method }

### 文献范围与组织方式

这是一篇定向叙述性综述，覆盖截至 2026 年 9 月 6 日的技术文献，通过 arXiv 检索与引用追踪纳入 ICL、one-shot imitation、video-conditioned policy、task embedding、几何匹配、retrieval、VLA 和 WAM 等关键词下的工作。论文使用技术原文与带版本的预印本，单独标明 GEN-1.5 等官方技术报告；随文 inventory 记录来源、版本与纳入理由。（§1.2）

### 固定参数，更新自适应状态

作者把部署中的更新写为：

$$
m_t=U_\theta(m_{t-1},o_t,a_{t-1},r_t,C),\qquad
a_{t:t+H-1}\sim\pi_\theta(\cdot\mid o_t,m_t,C,\ell).
$$

其中 $$C$$ 是示范或经验集合，$$m_t$$ 可以是任务 embedding、记忆、检索结果或图结构；观测、动作、奖励等通道按具体方法取用。适配期间 $$\theta$$ 保持固定，推断结果通过 $$m_t$$ 和条件序列影响动作。作者将推断目标分为三类：**T（任务）**包括对象、目标、次序和规则；**X（执行映射）**包括视觉对应、手到夹爪映射和动作语义；**D（环境）**包括动力学与持续的物理属性。

四个轴分别回答“提供哪些信息”“推断什么”“如何进入控制”“测试中变化了什么”。例如 ICRT [17] 保留 RGB、本体状态与动作序列，通过因果注意力预测动作块；IGA [14] 提供分割点云 waypoint，通过图能量优化对象相对位姿，再交给控制器执行。

### 五条技术路线

| 路线 | context 如何处理 | 如何产生动作 | 代表工作与准备基础 |
| :--- | :--- | :--- | :--- |
| 任务压缩 | 把示范汇聚成任务向量 | 当前状态与任务向量共同条件化策略 | TecNets [4]、BC-Z [19]；多任务动作训练与任务对齐 |
| 序列与记忆 | 保留局部时序信息，或递归压缩 | 注意力、SSM 后接动作回归或 diffusion | ICRT [17]、BPP [38]、RoboSSM [39]；支持/查询轨迹训练 |
| 几何对应 | 提取点云、关键点或图关系 | 位姿优化、动作变换、图扩散 | IGA [14]、IMOP [15]、Instant Policy [44]；几何表示与匹配先验 |
| 检索 | 按当前状态选择局部示例 | 条件预测与近邻动作先验结合 | REGENT [47]、RICL [48]；目标任务示范池及检索能力训练 |
| 人类视频到机器人执行 | 配对学习、运动估计或机器人未来预测 | 对应关系经 retargeting 或动作解码进入控制 | Vid2Robot [50]、HOST [58]、Zero-WAM [59]；目标机器人动作与跨域对应训练 |

任务压缩适合重复访问稳定的任务意图；局部序列保留随阶段变化的控制细节。几何方法把对象关系显式提供给策略，检索把大库中的相关经验送到当前控制时刻，人类视频方法则通过不同路径补上人类运动与机器人动作之间的对应。

RICL 的具体接口是从 20 条目标任务示范中取四个 image/action 近邻，使用经过 post-training 的 VLA 预测，并融合检索动作先验。这里“四个前缀示例”和“二十条可检索示范”描述两种资源。作者因此用 $$(K,L,A,I,M)$$ 记录 context 预算：示范数、保留帧数、动作标签、额外物理交互和检索池规模。（§2.3、§4.4）

### 交互历史如何增加信息

ICWM [63] 把机器人自行获得的观测—动作转移放入 context，通过探测结果建立指令与视觉变化的对应。Watch, Try, Learn [24] 使用尝试及二元反馈解决示范中的 affordance 歧义；Reflective VLA [64] 和 Zeva [65] 保留动作后果与跨尝试经验。Gated Memory Policy [16] 则把同一次任务中的状态记忆和跨尝试物理属性适配放在共同框架中讨论。（§6）

作者将状态记忆描述为恢复当前被遮挡或过去发生的事实，将环境适配描述为估计持续影响控制的规则或响应。一个隐藏物体属性可以同时影响状态估计和后续动作，因此两种作用可以共存。

## 4. 实验与证据
{: #evidence }

### 综述汇集的代表性对比

下表按综述 Table 5 与附录 A 整理各篇原有实验，保留其比较条件与指标。

| 关注信息 | 论文中的比较 | 结果 | 对应来源 |
| :--- | :--- | :--- | :--- |
| 视频中间过程 | Dasari–Gupta 分别训练全视频与末帧条件策略 | 成功率 88±5.0% 对 61±9.7% | [18]，原文附录 A.3 |
| 中间几何 waypoint | Instant Policy 固定模型，把十个 waypoint 减为最终 waypoint | 24 项 RLBench 任务成绩下降 71 个百分点 | [44]，原文 §4.2 / Table 2 |
| 示范数 | Instant Policy 以两条为基准 | 一条降低 12 个百分点，三条增加 2 个百分点 | [44]，原文 Table 2 |
| 检索适配整体收益 | RICL 的后训练加检索，与原始 VLA 比较 | 八项任务完整成功率 31.25% 对 2.5% | [48]，原文 §6 / Fig. 4 |
| context 视频内容 | The Imitator Game 固定 ACT/DINOv2，提供正确、相似或无关视频 | 原任务成功率 81% / 31% / 30% | [67]，原文附录 C.6 / Table 10 |
| 交互转移中的通道 | ICWM 的完整、去动作、去图像条件 | 六个未见视角的平均成绩为 25.0% / 21.6% / 10.9% | [63]，原文 §6.1 / Table 1 |

这些对比呈现了各自设置中的信息贡献。Instant Policy 的 waypoint 包含几何和夹爪状态；RICL 的差异同时包含模型后训练与检索；视频替换实验统计原任务成功率。综述用“方法×实验×版本”保存这些条件，把同一 checkpoint 的部署变化和重新训练后的设计比较分别列出。

### 直接以示范指定任务的基准

RoboCasa-DC [57] 用 Panda 或 GR-1 视频条件化同一 Panda 执行机器人，测试未见厨房任务；DrawAnything [38] 用单条示范指定绘画，报告 Chamfer 轨迹误差；LIBERO-Gen [38] 测试已见技能的新取放组合与两步任务链，报告闭环成功率。

The Imitator Game [67] 依次改变布局、物体外观/几何及 affordance。综述记录其五项模拟未见任务上，十五种模型变体在不同预训练规模汇总后的零样本成功率为 2–13%；真机已见任务中，四种代表模型在 L0–L2 平均约 54–55%，在功能替代 L3 为 39%。这些结果使任务选择、几何迁移和功能替代成为可分别讨论的能力。（§7.1）

### 综述形成的主要结论

作者归纳出三条共同规律：几何表示提前提供空间对应，使策略集中学习与动作有关的变换；任务向量适合保存可复用意图，可寻址的局部历史则支持阶段相关控制；人类视频通过配对数据、运动估计或机器人未来模型取得可执行对应。交互历史进一步提供动作响应，使适配覆盖示范中隐藏的物理条件。（§8）

## 5. 相关工作
{: #related-work }

本文与一般 ICL 综述 [2,6] 的连接点是固定参数下的示例条件推断；与机器人基础模型综述 [7] 的连接点是感知、规划及控制的预训练基础；与 in-context RL 综述 [8,9] 的连接点是观测—动作—奖励历史中的适配。人类视频综述 [10] 和 WAM 综述 [11] 分别提供跨域数据与预测—动作耦合的背景。本文将这些脉络集中到操作任务中的示范信息、对应关系和部署执行。

## 6. Insights · 思考与启示
{: #takeaways }

### 批判性阅读：“一条示范”对应多少可用信息？

完整动作标注、第一视角 RGB 视频和经过检索筛选的示例，包含的信息与准备成本不同。跨论文成功率还混合了基座能力、任务难度与训练数据，分类表适合梳理接口，性能归因需要更严格的共同条件。

**区分实验。** 可用同一检查点和同一任务，分别提供目标描述、关键帧、完整视频及带动作示范，并对齐可见物体与步骤信息。再加入随机和相似度检索对照，观察收益来自示范内容、检索质量还是额外标注。

### 进一步的阅读联系

**阅读联想：ICL 的粒度可以从推断对象开始定义。** “做哪件事”属于任务层，“这段运动怎样对应当前对象与机器人”属于执行层，“当前材料或接触怎样响应动作”属于环境层。对于已经 force-conditioned 的策略，实时力信号描述当前接触，而此前的动作—力响应可以承载对持续接触条件的判断。这让 force context 的作用有了更具体的描述方式。

**阅读联想：历史长度与有效信息密度是两个维度。** 原文中十个 waypoint 到最终 waypoint 的变化，以及两条到三条示范的变化，说明 context 内容可以比示范条数更影响执行。对应接触操作，具有动作变化、接触建立或状态转换的片段，值得作为理解历史表征的基本单位。

**作者提出的后续方向**集中在选择能消解歧义的示例、按执行需要重新访问局部片段，以及用交互结果澄清对应关系。由此形成的共同主题是：预训练提供解释经验的基础，部署 context 提供当前任务或条件中尚待确定的信息。（§9）

## 参考与补充

[^survey]: Wenhao Li. *In-Context Learning from Demonstrations for Robotic Manipulation: A Survey*. Preprints.org，2026-09-09，v1。[论文与附件入口](https://www.preprints.org/manuscript/202609.0780/v1) · [DOI](https://doi.org/10.20944/preprints202609.0780.v1)。四轴框架见 §2，方法见 §3–6，基准见 §7，证据汇总与来源见 Table 5、附录 A。笔记中的方括号编号沿用这篇综述 References。

关键论文入口：[17] [ICRT](https://arxiv.org/abs/2408.15980)，[38] [BPP](https://arxiv.org/abs/2606.30457)，[44] [Instant Policy](https://arxiv.org/abs/2411.12633)，[48] [RICL](https://arxiv.org/abs/2508.02062)，[58] [HOST](https://arxiv.org/abs/2607.20033)，[59] [Zero-WAM](https://arxiv.org/abs/2608.26103)，[63] [ICWM](https://arxiv.org/abs/2606.26025)，[65] [Zeva](https://arxiv.org/abs/2608.30880)。

</div>
