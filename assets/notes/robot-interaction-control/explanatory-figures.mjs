// Copyright (c) 2026 qq7r. All Rights Reserved. See LICENSE.
// Original explanatory diagrams; see the article captions for primary sources.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const output = fileURLToPath(new URL('../../../img/robot-interaction-control/', import.meta.url));
fs.mkdirSync(output, { recursive: true });
const C = { ink: '#203b50', muted: '#586f7e', teal: '#087f8c', blue: '#3769ac', red: '#b45038' };
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const text = (x, y, s, size = 23, color = C.ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(s)}</text>`;
const line = (x1,y1,x2,y2,color=C.teal,extra='') => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="3" fill="none" ${extra}/>`;
const arrow = (x1,y1,x2,y2,color=C.teal) => line(x1,y1,x2,y2,color,`marker-end="url(#${color===C.red?'red':'teal'})"`);
function box(x,y,w,h,title,lines=[],color=C.teal) {
 return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${color}" stroke-width="2"/>`
  +text(x+18,y+35,title,25,color,'font-weight="600"')+lines.map((s,i)=>text(x+18,y+70+i*31,s,22,C.muted)).join('');
}
function save(name,height,title,description,body) {
 fs.writeFileSync(output+name+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${height}" viewBox="0 0 700 ${height}" role="img"><title>${escape(title)}</title><desc>${escape(description)}</desc><defs>${[['teal',C.teal],['red',C.red]].map(([id,c])=>`<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="${c}"/></marker>`).join('')}</defs><rect width="700" height="${height}" rx="14" fill="#f6f9fc"/><g font-family="Noto Sans CJK SC, Microsoft YaHei, sans-serif">${text(25,40,title,28,C.ink,'font-weight="600"')}${body}</g></svg>\n`);
}
function arm(x,y,scale=1) {
 return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 150 V105 L70 30 L150 75 L200 150" fill="none" stroke="#7b91a3" stroke-width="25" stroke-linejoin="round"/><circle cx="70" cy="30" r="14" fill="#fff" stroke="#7b91a3" stroke-width="5"/><circle cx="150" cy="75" r="14" fill="#fff" stroke="#7b91a3" stroke-width="5"/><rect x="176" y="152" width="48" height="25" rx="4" fill="${C.teal}"/></g>`;
}
let scene=arm(55,65,1.1)+`<rect x="190" y="260" width="450" height="72" fill="#dcebed"/>`+line(190,260,640,260,C.ink)
 +arrow(275,190,275,242,C.red)+text(295,205,'F：垫子压表面',21,C.red)
 +arrow(335,310,335,264)+text(355,308,'环境反力 −F',21,C.teal)
 +arrow(475,205,615,205)+text(480,185,'+y：沿表面擦拭',21)
 +arrow(610,270,610,350)+text(485,378,'+x：压入表面',21)
 +line(225,304,305,304,C.blue,'stroke-dasharray="6 5"')+text(38,324,'平衡点 x₀',21,C.blue)
 +text(430,250,'未变形表面 x_w = 0',20,C.muted)
 +box(25,407,650,120,'同一场景，只更换法向控制器',['Kₑ 决定表面软硬；x 是垫面的真实位置。','导纳再引入虚拟参考 x_v，由内环追踪。']);
save('wiping-scene',550,'贯穿任务：接近、压住、沿表面移动','机器人擦拭垫接触弹性表面；法向x压入表面为正，切向y沿表面，机器人推力F与环境反力相反。',scene);
let jac=arm(55,90,1.3)+arrow(315,315,440,315,C.red)+text(340,291,'点力 f',24,C.red)
 +text(35,365,'同一处受力，同时影响多个关节',23)
 +box(25,405,650,130,'从末端到关节：功率是同一个量',['末端速度 v = J q̇；外力矩 τ_ext = Jᵀ f。','选哪个接触点，就用哪个点的 J。'])
 +text(70,128,'关节 1',22)+text(236,171,'关节 2',22)
 +`<path d="M125 185 A40 40 0 0 1 178 210" stroke="${C.teal}" stroke-width="3" fill="none" marker-end="url(#teal)"/>`
 +`<path d="M250 220 A36 36 0 0 1 291 248" stroke="${C.teal}" stroke-width="3" fill="none" marker-end="url(#teal)"/>`;
save('jacobian-contact',555,'点力怎样变成关节力矩？','示意机械臂末端点力通过各关节力臂产生力矩，功率一致性给出雅可比转置映射。图形只表示两个可见关节。',jac);
let states=box(45,80,600,84,'接近表面',['运动目标；有限接近速度'])+arrow(345,168,345,210)
 +text(365,198,'接触持续成立',20,C.muted)
 +box(45,215,600,84,'建立接触',['逐步增加目标力；保持参考连续'])+arrow(345,303,345,345)
 +box(45,350,600,84,'沿表面擦拭',['切向运动＋法向交互控制'])+arrow(345,438,345,480)
 +text(365,468,'完成 / 失去接触',20,C.muted)
 +box(45,485,600,118,'退出，或重新接近',['卸载并保持，或带速度约束搜索表面。','任务逻辑负责切换目标，控制器负责执行。'])
 +`<path d="M45 544 H20 V122 H40" stroke="${C.teal}" stroke-width="2.5" fill="none" marker-end="url(#teal)"/>`;
save('contact-states',630,'把 3.10 的“失去接触”接回任务流程','从接近、建立接触到擦拭，再按完成或接触丢失选择退出或重新接近。',states);
function platform(name,title,commands,robot,foot,positiveForce) {
 let b=box(30,78,640,145,'用户侧：本例交给机器人的命令',commands)
  +arrow(340,227,340,273)+box(30,280,640,115,'机器人控制器与接口边界',robot)
  +arrow(340,399,340,443)+arm(65,425,.85)
  +`<rect x="185" y="577" width="440" height="50" fill="#dcebed"/>`+line(185,577,625,577,C.ink)
  +arrow(235,545,235,590,C.red)+text(267,550,'机器人向下压表面',22,C.red)
  +arrow(570,565,570,475)+text(585,502,'+Z',22)
  +text(350,638,positiveForce,22,C.teal,'text-anchor="middle"')
  +box(30,661,640,110,'读图时追踪这个区别',foot);
 save(name,795,title,'同一压表面任务的用户命令、机器人内部接口与力方向示意。机械臂轮廓为功能示意。',b);
}
platform('franka-interface','Franka：用户计算力矩，机器人执行',
 ['实际状态＋模型 → 弹簧阻尼任务力矩','τ_user = c − Jᵀ(K₆ δx₆ + B₆ V)','通过 FCI 发送；本文例子为固定平衡位姿'],
 ['机器人内部加入重力与电机摩擦补偿。','实际状态返回用户回调，形成反馈。'],
 ['K₆、B₆ 塑造响应；本例保留本体有效惯量。'], '末端接触力由控制与环境共同形成');
platform('ur-interface','UR：指定力轴与机器人施加的力',
 ['force_mode：任务坐标＋选择轴＋wrench','世界 +Z 向上，机器人向下压 5 N：','wrench 的 F_z = −5 N'],
 ['内置力模式调节选中的法向轴。','配套运动程序规定切向轨迹。'],
 ['顺应轴 limits 是速度；其他轴是偏差上限。'], '环境向上反推，F_ext,z = +5 N');
platform('flexiv-interface','Flexiv：指定力轴与 TCP 感受到的力',
 ['笛卡尔运动—力模式：位姿＋目标 wrench','世界 +Z 向上，机器人向下压 5 N：','所引 RDK 的目标 F_z = +5 N'],
 ['明确力参考系、力控轴与主动 / 前馈模式。','记录实际位姿与 TCP 感受到的 wrench。'],
 ['同一物理作用，UR 与所引 Flexiv API 符号相反。'], 'TCP 感受到环境向上的 +5 N');
