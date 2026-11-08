---
layout: post
title: "机器人 ICL 综述：从上下文粒度、训练关系到动作执行接口"
date: 2026-10-30 00:00:00 +0800
published: true
categories: [论文笔记]
tags: ["ICL", "机器人学习", "综述"]
description: "用四类执行接口、五种上下文单位和三种训练组织理解机器人 ICL，以及任务学习与物理适配的关系。"
math: true
toc: true
paper:
  title: "In-context learning for robots: methods and applications"
  authors: "Haojian Huang; Zexi Li; Junhao Guo; Yehang Zhang; Wenxuan Peng; et al."
  venue: "arXiv 综述 · 2026"
  url: "https://arxiv.org/abs/2609.36012v1"
  pdf: "https://arxiv.org/pdf/2609.36012v1"
  code: "https://github.com/JethroJames/awesome-robots-icl"
  project: "https://jethrojames.github.io/awesome-robots-icl/"
  subjects: ["Computer Science - Machine Learning", "Computer Science - Robotics"]
  takeaway: "综述按上下文到动作的接口划分条件策略、几何迁移、世界模型控制和技能执行四类方法。成对轨迹、连续流和跨尝试记录通过不同的数据关系训练上下文能力。它将任务要求与物理响应分别组织，并汇总训练多样性、场景预览和经验记忆等研究的对照证据。"
  abstract: "General-purpose robots must infer what a new task requires and translate that understanding into appropriate physical action. In-context learning (ICL) for robots supports this process by using demonstrations and interaction to direct existing competence with neural parameters held fixed during deployment. We organize this literature review around the interfaces connecting contextual evidence to execution, distinguishing four families: context-conditioned policies, geometric demonstration transfer, world-model-based control, and skill- and agent-based execution. Comparing these interfaces clarifies their transfer assumptions and the roles of training, correspondence, and memory in making context useful. Across manipulation and navigation, we examine how these mechanisms preserve taught requirements as objects, environments, and execution conditions change. This analysis links method design to evaluation practices that distinguish responsiveness to teaching, physical transfer, and benefits from retained experience. The resulting agenda connects compositional task acquisition and faithful transfer with physical recursive self-improvement, in which experience improves the ability to learn subsequent tasks."
---

{% include paper_note_style.html %}
{% include pdf_embed.html file=page.paper.pdf %}

<div class="paper-note-container" markdown="1">

{% include paper_note_header.html %}

## 1. 问题与背景
{: #problem }

机器人已经掌握抓取、移动和插入等能力后，现场仍会出现需要新证据才能决定的事情：装配顺序由示范指定，较紧的配合由接触响应暴露，几分钟前完成了哪一步则依赖记忆。这篇综述围绕**上下文中的证据怎样进入动作执行**梳理机器人 ICL，把任务理解、物理适配与经验保留放在同一套表达中。（§1–2）

综述的核心研究对象是部署时神经参数固定、通过示范和交互调整行为的系统，同时将测试时参数更新作为相邻适配机制比较。它区分 S3“基于历史的适配”和 S4“上下文任务学习”：前者利用交互结果推断当前条件，后者从教学信息推断任务要求。二者可以共用一个模型，也可以使用相同模态。（§2.1–2.2）

## 2. 核心贡献
{: #contributions }

1. 按上下文到动作的执行接口，划分上下文条件策略、几何示范迁移、世界模型控制、技能与智能体执行四类方法。
2. 把对应关系和记忆作为跨类别机制，解释示范如何对齐当前对象，以及关键证据如何保留到需要它的时刻。
3. 系统讨论上下文能力的训练来源：成对轨迹、连续交互流和跨尝试记录分别建立不同的证据—行为关系。
4. 将任务要求、物理实现和经验复用连接到评价协议，并汇总已有研究的对照结果。（§1、§3–7）

## 3. 方法
{: #method }

### 用同一套接口描述不同系统

当前尝试的历史为 $$h_t=(o_1,a_1,\ldots,a_{t-1},o_t)$$，上下文 $$C_t$$ 可包含示范、语言、纠正或检索到的旧经历。动作块分布写为：

$$
A_t\sim\pi_\theta(\cdot\mid h_t,C_t),\qquad
C_{t+1}=U_\theta(C_t,o_t,a_t,o_{t+1}).
$$

第二式展示一个自包含记忆状态怎样吸收“动作及其结果”。观测可包括图像、本体状态、力、触觉与反馈消息；发出的命令和后续测得的物理状态在时间序列中分别记录。固定参数适配时，变化发生在输入证据、循环状态或外部记忆中。（§2.2，式 1–3）

综述另用 Fig. 6 区分适配信息的存储位置：显式上下文、循环状态、外部记忆、测试时快速权重，以及跨任务保留的更新权重。RoboTTT [10] 和 WAM-TTT [11] 放在快速权重更新这一分支。这个区分同时交代了更新对象、更新时机和重置行为。（§2.2）

### 四类方法：上下文经过什么中间表示成为动作

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2609.36012v1#page=29">查看原图</a> · <strong>原文 Fig. 12 · 四种上下文到动作的路径。</strong> 上下文分别变成动作条件、接触参考、预测未来或技能序列，代表方法为原文 [14,38,24,30]。 来源：In-Context Learning for Robots，arXiv v1，PDF 第 29 页。</p>

| 方法类别 | 从上下文提取的内容 | 执行路径 | 原文代表 |
| :--- | :--- | :--- | :--- |
| 上下文条件策略 | 任务特征、相关示例、交互历史 | 特征进入动作生成器，或选取相容动作 | Vid2Robot [14]、RICL [17] |
| 几何示范迁移 | 接触坐标系、相对运动或目标位姿 | 对应匹配、重定向、跟踪或回放 | DINOBot [34]、SemAnCorr [38] |
| 世界模型控制 | 预期未来或候选动作的后果 | 未来条件动作解码，或基于预测选择动作 | Demo-JEPA [22]、Zero-WAM [24] |
| 技能与智能体执行 | 技能顺序、参数、程序或工具请求 | 独立执行器实现这些操作 | UniSkill [30]、Show-Harness [31] |

例如“先放红块、再放蓝块”可以被编码成动作条件、转移后的运动参考、展示这一顺序的未来视频，或两个有顺序的技能调用。四种方法保留任务要求的位置不同，因而分别依赖上下文解释器、几何对应、未来预测和执行技能。（§3.1–3.4）

世界模型控制内部还有两种方向：从教学信息预测希望实现的未来，再解码动作；或者先给定候选动作，预测其后果，再依据任务要求选择。综述也按部署计算区分未来预测的作用：辅助预测目标可以在训练中塑造动作表示，预测条件控制则在执行时继续消费预测结果。（§3.3）

### 上下文的五种粒度

| 上下文单位 | 保留的信息 | 主要回答的问题 |
| :--- | :--- | :--- |
| Support example | 示范与输入—输出示例 | 当前任务、程序和接触要求是什么 |
| Scene preview | 探索视角与空间记录 | 物体、路径和布局在哪里 |
| Query history | 当前执行的观测与动作 | 做到了哪一步、刚刚发生了什么 |
| Transition sequence | 观测—动作—结果序列 | 当前系统怎样响应干预 |
| Cross-attempt record | 多次尝试、摘要与纠正 | 重置后可以复用什么经验 |

这张表对应原文 Table 10。粒度与模态分别描述信息组织和测量通道：一段视觉序列可以是教学示范，也可以是当前执行历史；同步的状态—动作—力记录可以作为物理响应证据。Support、query 和监督目标分别指定可见通道，因而人类视频教学与机器人力反馈执行可以使用不同的信息组合。（§4.1–4.2）

### ICL 能力怎样通过训练获得

原文 Table 11 将训练组织概括为三种形式。**成对轨迹**让 support 与 query 共享任务或环境，由 support 帮助预测 query 动作；**连续流**让较早观测和动作解释后续行为；**跨尝试记录**保留尝试、结果与纠正之间的关联，在重置后继续使用先前证据。（§4.2）

成对监督的一般目标为：

$$
\mathcal L(\theta)=\mathbb E_{(D^s,\tau^q)\sim P_{\mathrm{pair}}}
\left[\frac{1}{|I^q|}\sum_{t\in I^q}
\ell_\theta(A_t^q;h_t^q,D^s)\right].
$$

$$P_{\mathrm{pair}}$$ 决定哪些执行被看作同一个教学问题，$$I^q$$ 指定受监督的 query 位置。损失可以是似然、回归、去噪或 flow matching；这些目标共享“先前证据解释当前动作”的关系。若教学要求包括从杯柄抓取，配对规则就需要保留这一接触要求；共享“把杯子放好”的终点标签会形成更粗的任务关系。（§4.2，式 21）

RoboTTT 的 DAgger Distillation 用完整执行记录作上下文，把人工纠正位置作为动作目标。失败动作记录此前尝试过什么，纠正动作规定应学习的后续行为。连续流路线则通过时间上连续的物理经历建立依赖，例如综述描述 GEN-1.5 [98] 使用连续片段的下一动作训练。不同组织方式分别提供示范—执行、过去—现在和尝试—改正的学习关系。（§4.2）

### 任务变化与物理变化

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2609.36012v1#page=56">查看原图</a> · <strong>原文 Fig. 20 · 任务关系与物理响应。</strong> 示范说明意图，交互揭示实现方式；这是综述组织研究问题的概念示意图。 来源：In-Context Learning for Robots，arXiv v1，PDF 第 56 页。</p>

Fig. 20 把任务关系和物理响应作为可独立变化的两个维度：换装配顺序改变任务，换摩擦或负载改变响应，柔性物体与工具使用可以同时涉及二者。示范传达意图，交互揭示实现方式。身体与动力学适配章节以 RMA [39]、LocoFormer [40] 和 RopeFormer [364] 等工作，说明动作历史如何为当前身体、地面或物体响应提供信息。（§6.1、§6.4）

## 4. 实验与证据
{: #evidence }

### 综述怎样组织证据

本文通过文献中的组内对照连接训练组织、上下文使用和物理迁移。Table 16 汇总各项研究的设置、干预变量与指标；下表保留这些研究各自的评价口径。（§7.2）

| 关注点 | 原研究及设置 | 综述报告的结果 | 位置 |
| :--- | :--- | :--- | :--- |
| 固定示范预算下的任务多样性 | BPP [54]；10,000 条绘图示范，3 个种子 | 500/1000/2000 个任务对应 Chamfer 误差 9.5/5.1/3.4 px | Fig. 15a，p43 |
| 预览视频的导航价值 | NOLO [351]；Habitat，3 个种子 | 成功率 33.58%→43.65% | Table 16，p66 |
| 几何迁移粒度 | Part-based transfer [347]；杯子放置到杯架 | 整体形变到部件形变：11/27→23/27 | Table 16 |
| 保留经验的贡献 | Zeva [88]；5 个真机任务 | 持久记忆带来 10–20 个百分点成功率提升 | Table 16 |

<p class="paper-sidenote"><a href="https://arxiv.org/pdf/2609.36012v1#page=43">查看原图</a> · <strong>原文 Fig. 15 · 训练多样性与提示方式。</strong> 左侧保持示范总量，右侧比较数据规模与提示方式；S1 曲线采用包含人工恢复的累计逐步骤指标。 来源：In-Context Learning for Robots，arXiv v1，PDF 第 43 页。</p>

BPP 的比较保持示范总数为 10,000，让每任务示范数从 20 变为 10 和 5，因而刻画的是任务分配的作用。S1 [99] 的比较则随预训练规模从 1k 增至 100k 小时，在未见任务上示范提示从 1% 升至 66%，语言提示从 0% 升至 9%；这里采用包含人工恢复介入的累计逐步骤成功指标。两组证据分别涉及固定预算下的任务多样性，以及数据扩展与提示方式的共同变化。（§4.2，p43）

### 评价维度

综述将评价串成三个问题：改变教学证据后行为是否按要求改变；示范中的关系经过对象和环境变化后是否仍被实现；保留经历是否帮助后续尝试。它进一步区分终点完成、顺序遵循、接触要求和物理可执行性，并记录教学成本、反馈到动作的延迟，以及重复作业中的复用收益。（§7）

## 5. 相关工作
{: #related-work }

综述把 One-Shot Imitation Learning [1] 与 RL² [2] 作为两条历史来源：前者通过示范推断意图，后者通过结果推断任务或动力学。Algorithm Distillation [6] 将学习过程组织成序列；ICRT [13]、RICL [17] 等把示范与传感动作记录连接到机器人策略。（§1、§2.4）

它与机器人模仿学习、跨本体学习、人类视频学习和世界模型综述形成互补：本文贯穿这些方向的主线是“何种新证据改变了哪个执行中间量”。Appendix C 比较相邻综述，Appendix B 按方法接口、资源和训练组织提供索引。读者可以从一个接口出发，再沿对应关系、记忆和数据进入相关领域。（§1、Appendix B–C）

## 6. Insights · 思考与启示
{: #takeaways }

### 批判性阅读：任务提示与物理适配需要怎样不同的证据？

更换示范后完成不同目标，证明策略会响应任务提示；在同一目标下识别新负载或摩擦，才检验物理适配。两者都可使用历史，却依赖不同的信息和训练准备。

**区分实验。** 可将任务意图与物理条件正交组合，固定检查点，分别替换外部示范和自身交互历史。报告目标执行正确率与条件改变后的恢复速度，并记录上下文、快速状态及参数的重置规则，使不同“ICL”接口的比较有明确操作定义。

### 进一步的阅读联系

**阅读联想：力反馈 ICL 可以首先定位为物理响应适配。** 对已经具备 force-conditioned policy 的系统，任务指令可以保持固定，动作后的力响应帮助解释当前接触条件。这与综述的 transition sequence、S3 和 Fig. 20 左下象限直接对应；教学示范再加入新的接触目标或操作顺序时，任务学习与物理适配开始组合。

**阅读联想：粒度应由需要识别的关系决定。** 单帧力读数描述当前载荷，一段动作—结果描述局部响应，一次失败及其回撤包含更完整的接触过程。表中五种单位给出了从即时状态、接触事件到跨尝试记忆的连续视角，也把“接入新模态”和“学习跨时间的关系”分别说清楚。

**阅读联想：模型学会使用 context 的关键落在训练关系。** 已有动作能力、能够读取力、能够利用历史纠正行为，是可以逐层组织的能力。综述的配对分布与目标掩码为这种区分提供了具体语言：先前哪段证据，应当解释后续哪个动作，以及这种关系如何在训练样本中反复出现。

## 参考与补充

Haojian Huang 等，**In-Context Learning for Robots: Methods and Applications**，2026。[arXiv:2609.36012v1](https://arxiv.org/abs/2609.36012v1) · [项目](https://jethrojames.github.io/awesome-robots-icl/) · [文献索引](https://github.com/JethroJames/awesome-robots-icl)。分类见 §3；训练与上下文粒度见 §4；物理适配见 §6.4；对照证据见 §7、Table 16。笔记中的参考编号沿用原文。Fig. 12 汇编了 Vid2Robot、SemAnCorr、Zero-WAM、UniSkill 的方法图像；Fig. 20 是综述的概念示意图，原文图像出处说明见 p76。

</div>
