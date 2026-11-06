// Copyright (c) 2026 qq7r. All Rights Reserved. See LICENSE.
// Generated original figures are covered by LICENSE-Content.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Reading reconstructions. Run with: node assets/notes/paper-reading/figures.mjs
const root = fileURLToPath(new URL('../../../', import.meta.url));
const ink = '#203b50', muted = '#52697a', teal = '#007c83', blue = '#3769ac';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size = 24, color = ink, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
const rect = (x, y, w, h, color = teal, fill = '#ffffff') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
const arrow = (x1, y1, x2, y2, color = teal, dashed = false) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="3" ${dashed ? 'stroke-dasharray="7 5"' : ''} marker-end="url(#${color === blue ? 'blue' : 'teal'})"/>`;
function svg(height, title, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${height}" viewBox="0 0 700 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc>
<defs>${[['teal', teal], ['blue', blue]].map(([id, color]) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="${color}"/></marker>`).join('')}</defs>
<rect width="700" height="${height}" rx="14" fill="#f6f9fc"/>
<g font-family="Noto Sans CJK SC, Microsoft YaHei, sans-serif">${text(28, 42, title, 27, ink, 'font-weight="600"')}${body}</g></svg>
`;
}
function save(directory, name, content) {
  const path = `${root}img/${directory}`;
  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(`${path}/${name}.svg`, content);
}

let execution = rect(30, 75, 640, 105, muted)
  + text(50, 112, '离线：示范 → 平滑力 → 构造动作标签')
  + text(50, 151, '标签监督：参考位姿、虚拟目标、低刚度', 22, muted)
  + arrow(350, 184, 350, 239, teal, true)
  + text(370, 218, '学得策略参数', 21, muted)
  + rect(30, 245, 640, 175)
  + text(50, 282, '在线：RGB / 位姿 / 力历史 → 扩散策略')
  + text(50, 320, '每臂输出 19 维动作', 22, muted);
for (const [x, title, dimension] of [[48, '参考位姿', '9D'], [260, '虚拟目标', '9D'], [472, '低刚度', '1D']]) {
  execution += rect(x, 343, 180, 58, teal, '#eaf5f5') + text(x + 90, 380, `${title} ${dimension}`, 21, ink, 'text-anchor="middle"');
}
execution += arrow(350, 424, 350, 477)
  + rect(30, 485, 640, 140)
  + text(50, 522, '位置差 d = p_virtual − p_ref → 方向 u')
  + text(50, 562, 'K = k_high I + (k_low − k_high) uuᵀ', 24, teal)
  + text(50, 598, '三维平移刚度；姿态由位姿目标指定', 22, muted)
  + arrow(260, 629, 260, 689)
  + text(280, 663, 'K ＋ 虚拟目标', 22, teal)
  + rect(30, 697, 440, 107)
  + text(52, 735, '高频导纳控制器')
  + text(52, 775, '实时力 → 运动响应 / 位姿指令', 22, muted)
  + rect(510, 697, 160, 107, blue, '#edf2fa')
  + text(590, 738, 'F/T', 25, blue, 'text-anchor="middle"')
  + text(590, 777, '实时反馈', 22, blue, 'text-anchor="middle"')
  + arrow(506, 750, 475, 750, blue)
  + arrow(260, 808, 260, 863)
  + rect(30, 870, 440, 70)
  + text(250, 914, '机器人 ↔ 接触环境', 24, ink, 'text-anchor="middle"')
  + `<path d="M474 905 H590 V809" fill="none" stroke="${blue}" stroke-width="3" marker-end="url(#blue)"/>`
  + text(30, 984, '读图重点：参考位置用于恢复方向；', 22, muted)
  + text(30, 1019, '虚拟目标与刚度矩阵共同决定执行响应。', 22, muted);
save('arxiv-2410.09309', 'reading-execution', svg(1050, 'ACP：从离线标签到在线闭环', '训练标签与在线执行分层。参考位置和虚拟位置之差恢复方向，刚度与虚拟目标进入实时力反馈闭环。', execution));

let geometry = text(28, 82, '固定目标、固定轴 u；Δx = K⁻¹ Δf', 23, muted)
  + text(28, 119, '相同力增量：两轴均为 1；刚度示例：高 4，低 1', 22, muted);
for (const [index, title, ku, kv, note] of [
  [0, '各向高刚度', 4, 4, '两轴偏移都小'],
  [1, '各向低刚度', 1, 1, '两轴偏移都大'],
  [2, '沿 u 柔顺', 1, 4, '沿 u 让位，沿 v 保持刚度']
]) {
  const y = 150 + index * 190, ox = 455, oy = y + 45;
  const dx = 100 / kv, dy = 100 / ku;
  geometry += rect(25, y, 650, 175, '#cbd8e2')
    + text(45, y + 42, title, 25)
    + text(45, y + 80, `k_u = ${ku}，k_v = ${kv}`, 23, teal)
    + text(45, y + 122, note, 20, muted)
    + `<path d="M${ox} ${oy + 115} V${oy} H${ox + 125}" fill="none" stroke="#9caebb" stroke-width="2"/>`
    + text(ox + 132, oy + 7, 'v', 22, muted)
    + text(ox - 7, oy + 143, 'u', 22, muted)
    + `<path d="M${ox + dx} ${oy} V${oy + dy} H${ox}" fill="none" stroke="${teal}" stroke-width="1.5" stroke-dasharray="4 4"/>`
    + arrow(ox, oy, ox + dx, oy + dy)
    + text(ox + dx + 10, oy + dy + 6, 'Δx', 22, teal);
}
geometry += text(28, 751, '箭头按 1 / k 缩放；u 与 v 是正交方向。', 22, muted);
save('arxiv-2410.09309', 'reading-stiffness', svg(780, 'ACP：把柔顺限制在一个方向', '准静态的二维截面示意。两轴受相同增量力，高刚度为4低刚度为1，对应各轴位移为四分之一或一。', geometry));

let ablation = text(28, 83, 'Table III：三任务，每任务每配置 10 次', 23, muted);
const configs = [
  [125, 'π₀-base', '关节位置 q', '20.0%'],
  [325, '＋VIB', '仍用关节位置 q', '46.7%'],
  [525, '＋VIB & Force', '本体条件改为力矩 τ', '56.7%']
];
for (const [y, label, state, value] of configs) {
  ablation += rect(30, y, 640, 115)
    + text(52, y + 43, label, 26)
    + text(52, y + 85, state, 23, muted)
    + text(640, y + 67, value, 35, teal, 'text-anchor="end" font-weight="600"');
}
ablation += arrow(350, 244, 350, 317)
  + text(370, 282, '＋26.7 个百分点', 23, teal)
  + text(30, 280, '正则 ＋ 调度', 22, muted)
  + arrow(350, 444, 350, 517)
  + text(370, 482, '＋10.0 个百分点', 23, teal)
  + text(30, 480, 'q → τ', 22, muted)
  + text(30, 691, '待区分：表征正则、课程顺序、力信息', 25)
  + rect(30, 717, 640, 145, blue, '#edf2fa')
  + text(50, 756, '交叉对照：q / τ / q＋τ', 23, blue)
  + text(50, 795, '× 无 VIB / 固定 KL / 衰减 KL', 23, blue)
  + text(50, 834, '再用力矩时序干预检查模型如何依赖力', 22, muted)
  + text(30, 903, '较大的可见增量发生在引入力矩之前。', 23, ink);
save('arxiv-2602.12532', 'reading-ablation', svg(935, 'CRAFT：结果支持到哪一步？', '三任务消融的均值依次为20.0、46.7、56.7。相邻配置同时改变正则与调度，或改变本体状态表示，需要交叉对照区分机制。', ablation));
