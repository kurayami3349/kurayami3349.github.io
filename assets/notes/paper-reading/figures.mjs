// Copyright (c) 2026 qq7r. All Rights Reserved. See LICENSE.
// Generated original figures are covered by LICENSE-Content.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Run with: node assets/notes/paper-reading/figures.mjs
const root = fileURLToPath(new URL('../../../', import.meta.url));
const ink = '#263746', muted = '#657580', teal = '#007f82';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size = 26, color = ink, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
const line = (x1, y1, x2, y2, color = '#c8d0d5', extra = '') =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.5" ${extra}/>`;

function svg(height, title, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc>
<rect width="600" height="${height}" fill="#fff"/>
<g font-family="Noto Sans CJK SC, PingFang SC, Microsoft YaHei, Droid Sans Fallback, sans-serif">${body}</g></svg>
`;
}

function save(directory, name, content) {
  const path = `${root}img/${directory}`;
  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(`${path}/${name}.svg`, content);
}

// Each contour is K^-1 [cos(theta), sin(theta)] for unit force magnitude.
// A shared displacement scale makes the constrained direction directly visible.
let geometry = '';
for (const [index, label, ku, kv] of [
  [0, '高刚度', 4, 4],
  [1, '低刚度', 1, 1],
  [2, '沿 u 柔顺', 1, 4]
]) {
  const x = 100 + index * 200, y = 132, scale = 66;
  geometry += text(x, 30, label, 26, ink, 'text-anchor="middle"')
    + `<ellipse cx="${x}" cy="${y}" rx="${scale / ku}" ry="${scale / kv}" fill="${teal}" fill-opacity=".12" stroke="${teal}" stroke-width="2.5"/>`
    + line(x - 78, y, x + 77, y)
    + line(x, y + 78, x, y - 77)
    + `<path d="M${x + 72} ${y - 4} L${x + 78} ${y} L${x + 72} ${y + 4} M${x - 4} ${y - 72} L${x} ${y - 78} L${x + 4} ${y - 72}" fill="none" stroke="#9aa8b2" stroke-width="1.5"/>`
    + line(x + scale, y - 4, x + scale, y + 4, muted)
    + text(x + scale, y + 29, '1', 26, muted, 'text-anchor="middle"')
    + text(x + 82, y + 8, 'u', 26, muted, 'font-style="italic"')
    + text(x + 10, y - 74, 'v', 26, muted, 'font-style="italic"')
    + `<circle cx="${x}" cy="${y}" r="2.5" fill="${ink}"/>`
    + text(x, 241, `(${ku}, ${kv})`, 26, muted, 'text-anchor="middle"');
}
save('arxiv-2410.09309', 'reading-stiffness', svg(256,
  '相同力幅值下的位移轮廓',
  '固定目标和柔顺轴，准静态归一化位移增量为 K 的逆乘外力增量。力增量模长为一，方向扫过平面。高刚度产生半径0.25的小圆，低刚度产生半径1的大圆，沿u柔顺产生u半轴1、v半轴0.25的椭圆。三图坐标尺度相同，括号为u、v方向的刚度。',
  geometry));

// Table III: equal trial counts across three tasks; the full success-rate axis
// preserves the magnitude of the observed differences without causal labels.
const configs = [
  { label: 'q', value: 20.0, color: '#7d8b96' },
  { label: 'q + VIB', value: 46.7, color: '#547dac' },
  { label: 'τ + VIB', value: 56.7, color: teal }
];
const left = 150, right = 548, plotWidth = right - left;
let ablation = text(right, 28, '成功率（%）', 26, muted, 'text-anchor="end"');
for (const value of [0, 50, 100]) {
  const x = left + plotWidth * value / 100;
  ablation += line(x, 44, x, 207, '#e2e7ea')
    + text(x, 241, value, 26, muted, 'text-anchor="middle"');
}
for (const [index, { label, value, color }] of configs.entries()) {
  const y = 67 + index * 57, width = plotWidth * value / 100;
  ablation += text(left - 18, y + 9, label, 26, ink, 'text-anchor="end"')
    + `<rect x="${left}" y="${y - 13}" width="${width}" height="26" fill="${color}"/>`
    + text(left + width + 10, y + 9, value.toFixed(1), 26, color);
}
save('arxiv-2602.12532', 'reading-ablation', svg(256,
  'CRAFT 三任务消融成功率',
  '按Table III重绘，三任务各配置各10次。共同横轴从0至100%。π₀-base以关节位置q为条件时成功率20.0%，加入VIB后为46.7%，再换成关节力矩τ后为56.7%。',
  ablation));
