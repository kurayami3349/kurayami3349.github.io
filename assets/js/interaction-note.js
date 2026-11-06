// Copyright (c) 2026 qq7r. All Rights Reserved. See LICENSE.
import { cases, parametersFor, simulate } from '../notes/robot-interaction-control/contact-model.mjs';

const lab = document.querySelector('#contact-lab');
if (lab) {
  const find = selector => lab.querySelector(selector);
  const inputs = [...lab.querySelectorAll('[data-field]')];
  const timeInput = find('#lab-time');
  const narrow = window.matchMedia('(max-width: 600px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const units = { stiffness: 'N/m', damping: 'N·s/m', environment: 'N/m', force: 'N', anchor: 'mm', virtualMass: 'kg', innerHz: 'Hz', delay: 'ms' };
  const scales = { anchor: 1000, delay: 1000 };
  const primaryFields = { stiff: 'stiffness', soft: 'stiffness', force: 'force', admittance: 'innerHz', loss: 'stiffness', energy: 'damping' };
  const defaultViews = { stiff: 'force', soft: 'force', force: 'force', admittance: 'position', loss: 'position', energy: 'energy' };
  const color = { actual: 'var(--lab-actual)', reference: 'var(--lab-reference)', force: 'var(--lab-force)', energy: 'var(--lab-energy)', heat: 'var(--lab-heat)' };
  let selected = 'soft', parameters, result, view = 'force', playing = false;
  let frame, previousTime = 0, playbackTime = 0, speed = 0.25, entered = false, editTimer;
  let chartX, chartY, plotSeries = [], sceneScale = 3;
  const format = (n, digits = 1) => Number(n.toFixed(digits)).toString();
  const line = (x1, y1, x2, y2, attributes = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" ${attributes}/>`;
  const label = (x, y, value, attributes = '') => `<text x="${x}" y="${y}" ${attributes}>${value}</text>`;
  const energyEnabled = () => selected === 'energy' && parameters.force === 0 && !parameters.removeSurface;

  function stop() {
    playing = false;
    cancelAnimationFrame(frame);
    find('[data-play]').textContent = '▶';
    find('[data-play]').setAttribute('aria-label', '播放仿真');
  }
  function spring(x, top, bottom) {
    const length = bottom - top;
    let path = `M${x} ${top}`;
    for (let i = 1; i <= 10; i++) path += `L${x + (i === 10 ? 0 : (i % 2 ? -7 : 7))} ${top + length * i / 10}`;
    return `<path d="${path}" class="lab-spring"/>`;
  }
  function scene(point) {
    const w = narrow.matches ? 440 : 760, h = 344, surfaceY = 188, floor = 299;
    const center = w * 0.51 + 40 * Math.sin(Math.PI * point.t / 3);
    const x = point.x * 1000, xv = point.xv * 1000;
    const tip = surfaceY + x * sceneScale, ref = surfaceY + xv * sceneScale;
    const admittance = parameters.mode === 'admittance';
    const reference = admittance || parameters.stiffness > 0;
    const padWidth = 66, left = w * 0.21, right = w - 36;
    const contact = point.surface && point.force > 0.01;
    const reaction = Math.min(76, point.force * 6);
    // Planar two-link silhouette. Its pose illustrates the task; the simulated DOF is x.
    const bx = 40, by = 182, wx = center, wy = tip - 35;
    const distance = Math.hypot(wx - bx, wy - by);
    const l = Math.max(w * 0.24, distance / 1.95);
    const angle = Math.atan2(wy - by, wx - bx) - Math.acos(Math.min(1, distance / (2 * l)));
    const ex = bx + l * Math.cos(angle), ey = by + l * Math.sin(angle);
    let body = `<defs><marker id="lab-force-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${color.force}"/></marker></defs>`;
    body += label(16, 25, selected === 'loss' ? (point.surface ? (parameters.removeSurface ? '3 s 撤去表面' : '表面已恢复') : '表面已撤去') : admittance ? '虚拟垫子 → 实际垫子' : selected === 'energy' ? '振荡 → 耗散' : '压入 → 受力', 'class="lab-scene-caption"');
    // Large force readout, next to the physical scene instead of a separate data table.
    body += label(w - 20, 57, `${format(point.force)}<tspan class="lab-unit"> N</tspan>`, `text-anchor="end" class="lab-big-number" data-force fill="${color.force}"`);
    body += label(w - 20, 79, '接触力', 'text-anchor="end" class="lab-small"');
    if (parameters.force > 0) body += label(w - 20, 101, `${parameters.stiffness === 0 ? '目标' : '前馈'} ${format(parameters.force)} N`, 'text-anchor="end" class="lab-small"');
    if (point.surface) {
      const compression = Math.max(0, tip - surfaceY);
      const d = `M${left} ${surfaceY}H${center - 70}C${center - 46} ${surfaceY} ${center - 45} ${surfaceY + compression} ${center - 33} ${surfaceY + compression}H${center + 33}C${center + 45} ${surfaceY + compression} ${center + 46} ${surfaceY} ${center + 70} ${surfaceY}H${right}V${floor}H${left}Z`;
      body += `<path d="${d}" class="lab-surface"/>`;
      body += line(left, surfaceY, right, surfaceY, 'class="lab-zero-line"');
      body += spring(center, Math.max(tip, surfaceY) + 5, floor - 5);
      body += line(center - 21, floor, center + 21, floor, 'class="lab-spring"');
    } else {
      body += line(left, surfaceY, right, surfaceY, 'class="lab-zero-line"');
    }
    body += `<path d="M${bx} ${by}L${ex} ${ey}L${wx} ${wy}V${tip - 14}" class="lab-arm"/>`;
    body += `<rect x="${bx - 19}" y="${by - 4}" width="38" height="14" rx="4" class="lab-joint"/>`;
    for (const [cx, cy] of [[ex, ey], [wx, wy]]) body += `<circle cx="${cx}" cy="${cy}" r="9" class="lab-joint"/>`;
    if (reference) {
      body += `<rect x="${center - padWidth / 2 - 4}" y="${ref - 16}" width="${padWidth + 8}" height="16" rx="4" class="lab-ghost"/>`;
      body += line(center + 44, tip, center + 44, ref, `stroke="${color.reference}" stroke-width="2"`);
    }
    body += `<rect x="${center - padWidth / 2}" y="${tip - 14}" width="${padWidth}" height="14" rx="4" fill="${color.actual}"/>`;
    if (contact) body += line(center + 65, tip - 10, center + 65, tip - 10 + reaction, `stroke="${color.force}" stroke-width="4" marker-end="url(#lab-force-arrow)"`);
    // A fixed per-run ruler makes the zoom used for contact loss explicit.
    const tickMm = sceneScale > 2 ? 20 : sceneScale > 0.7 ? 50 : 100;
    body += line(right + 12, surfaceY, right + 12, surfaceY + tickMm * sceneScale, 'class="lab-ruler"');
    body += label(right + 6, surfaceY - 7, '0', 'text-anchor="end" class="lab-small"');
    body += label(right + 6, surfaceY + tickMm * sceneScale + 18, `${tickMm} mm`, 'text-anchor="end" class="lab-small"');
    if (energyEnabled()) {
      const total = result.points[0].energy, stored = Math.max(0, Math.min(1, point.energy / total || 0));
      const barX = 18, barWidth = w - 36;
      body += `<rect x="${barX}" y="304" width="${barWidth}" height="10" rx="4" fill="${color.heat}"/><rect x="${barX}" y="304" width="${barWidth * stored}" height="10" rx="4" fill="${color.energy}"/>`;
      body += label(barX, 340, `储能 ${format(point.energy, 3)} J`, `class="lab-small" fill="${color.energy}"`);
      body += label(w - 18, 340, `已耗散 ${format(point.dissipated, 3)} J`, `text-anchor="end" class="lab-small" fill="${color.heat}"`);
    } else {
      body += label(18, 333, `● 实际 ${format(x)} mm`, `class="lab-small" fill="${color.actual}" data-position`);
      if (reference) body += label(w - 18, 333, `▱ ${admittance ? '虚拟' : '平衡点'} ${format(xv)} mm`, `text-anchor="end" class="lab-small" fill="${color.reference}" data-reference`);
    }
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${point.surface ? '表面存在' : '表面已撤去'}，实际位置 ${format(x)} 毫米，接触力 ${format(point.force)} 牛顿">${body}</svg>`;
  }

  function drawPlot() {
    const admittance = parameters.mode === 'admittance';
    let unit;
    if (view === 'energy') {
      unit = 'J';
      plotSeries = [
        { key: p => p.energy, name: '储能', color: color.energy },
        { key: p => p.energy + p.dissipated, name: '储能＋耗散', color: color.heat, dash: true }
      ];
    } else if (view === 'position') {
      unit = 'mm';
      plotSeries = [{ key: p => p.x * 1000, name: '实际', color: color.actual }];
      if (admittance || parameters.stiffness > 0) plotSeries.push({ key: p => p.xv * 1000, name: admittance ? '虚拟' : '平衡点', color: color.reference, dash: true });
    } else {
      unit = 'N';
      plotSeries = [{ key: p => p.force, name: '接触力', color: color.force }];
      if (parameters.force > 0) plotSeries.push({ key: () => parameters.force, name: '目标 / 前馈', color: color.reference, dash: true });
    }
    const width = narrow.matches ? 440 : 760, right = width - 20;
    const values = plotSeries.flatMap(s => result.points.map(s.key));
    const min = Math.min(0, ...values), max = Math.max(...values);
    const padding = Math.max((max - min) * 0.08, unit === 'J' ? 0.005 : 0.5);
    const low = min - padding, high = max + padding;
    chartX = t => 62 + t / parameters.duration * (right - 62);
    chartY = v => 14 + (high - v) / (high - low) * 82;
    let body = '';
    for (const v of [min, max]) {
      body += line(62, chartY(v), right, chartY(v), 'class="plot-grid"');
      body += label(53, chartY(v) + 6, Number(v.toPrecision(3)), 'text-anchor="end"');
    }
    for (const t of [0, 3, 6]) body += label(chartX(t), 123, `${t}${t === 6 ? ' s' : ''}`, 'text-anchor="middle"');
    plotSeries.forEach(s => {
      const path = result.points.map((p, i) => `${i ? 'L' : 'M'}${chartX(p.t).toFixed(2)} ${chartY(s.key(p)).toFixed(2)}`).join(' ');
      body += `<path d="${path}" stroke="${s.color}" stroke-width="2.5" fill="none" ${s.dash ? 'stroke-dasharray="6 4"' : ''}/><circle data-dot r="4" fill="${s.color}"/>`;
    });
    body += '<path data-cursor class="plot-cursor"/>';
    find('[data-plot]').innerHTML = `<svg viewBox="0 0 ${width} 134" role="img" aria-label="${view === 'force' ? '接触力' : view === 'position' ? '法向位置' : '能量'}随时间变化，单位 ${unit}">${body}</svg>`;
    find('[data-legend]').innerHTML = plotSeries.map(s => `<span style="color:${s.color}">${s.dash ? '┄' : '━'} ${s.name}</span>`).join(' ') + ` / ${unit}`;
    lab.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  }
  function renderTime() {
    const t = Math.min(Number(timeInput.value), result.points.at(-1).t);
    const index = Math.min(result.points.length - 1, Math.round(t / (parameters.dt * 10)));
    const point = result.points[index];
    find('[data-time]').value = `${point.t.toFixed(2)} s`;
    find('[data-scene]').innerHTML = scene(point);
    find('[data-cursor]').setAttribute('d', `M${chartX(point.t)} 8V100`);
    lab.querySelectorAll('[data-dot]').forEach((dot, i) => {
      dot.setAttribute('cx', chartX(point.t)); dot.setAttribute('cy', chartY(plotSeries[i].key(point)));
    });
  }
  function calculate() {
    stop();
    for (const input of inputs) {
      const key = input.dataset.field;
      parameters[key] = Number(input.value) / (scales[key] || 1);
      find(`[data-value="${key}"]`).value = `${input.value} ${units[key]}`;
    }
    result = simulate(parameters);
    const maxPosition = Math.max(30, ...result.points.flatMap(p => [p.x * 1000, p.xv * 1000]));
    sceneScale = Math.min(3, 100 / maxPosition);
    timeInput.max = result.points.at(-1).t;
    timeInput.value = Math.min(Number(timeInput.value), Number(timeInput.max));
    const admittance = parameters.mode === 'admittance';
    find('[data-label="stiffness"]').textContent = admittance ? '虚拟刚度 K_a' : '刚度 K';
    find('[data-label="damping"]').textContent = admittance ? '虚拟阻尼 B_a' : '阻尼 B';
    find('[data-field="anchor"]').disabled = parameters.stiffness === 0;
    lab.querySelectorAll('[data-admittance]').forEach(label => { label.hidden = !admittance; });
    find('[data-view="energy"]').hidden = !energyEnabled();
    if (view === 'energy' && !energyEnabled()) view = 'force';
    find('[data-warning]').hidden = !result.stopped;
    find('[data-surface]').hidden = selected !== 'loss';
    find('[data-surface]').textContent = parameters.removeSurface ? '恢复表面' : '撤去表面';
    drawPlot(); renderTime();
  }
  function animate(now) {
    if (!playing) return;
    playbackTime = Math.min(Number(timeInput.max), playbackTime + Math.min((now - previousTime) / 1000, 0.08) * speed);
    previousTime = now;
    timeInput.value = playbackTime;
    renderTime();
    if (playbackTime >= Number(timeInput.max)) stop();
    else frame = requestAnimationFrame(animate);
  }
  function play() {
    stop();
    if (Number(timeInput.value) >= Number(timeInput.max)) timeInput.value = 0;
    playbackTime = Number(timeInput.value);
    playing = true; previousTime = performance.now();
    find('[data-play]').textContent = 'Ⅱ';
    find('[data-play]').setAttribute('aria-label', '暂停仿真');
    frame = requestAnimationFrame(animate);
  }
  function replay() {
    clearTimeout(editTimer);
    timeInput.value = selected === 'loss' ? 2.5 : 0;
    renderTime();
    if (!reducedMotion.matches) play();
  }
  function selectCase(name, autoplay = true) {
    if (!cases[name]) return;
    clearTimeout(editTimer);
    selected = name; parameters = parametersFor(name); view = defaultViews[name];
    for (const input of inputs) {
      input.value = parameters[input.dataset.field] * (scales[input.dataset.field] || 1);
      find('.lab-parameters').append(input.closest('label'));
    }
    find('[data-primary]').append(find(`[data-field="${primaryFields[name]}"]`).closest('label'));
    find('.lab-options').open = false;
    lab.querySelectorAll('[data-case]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.case === name)));
    speed = selected === 'loss' ? 1 : 0.25;
    find('[data-speed]').textContent = speed === 1 ? '1×' : '¼×';
    timeInput.max = parameters.duration;
    timeInput.value = selected === 'loss' ? 2.5 : 0;
    calculate();
    if (autoplay && !reducedMotion.matches) play();
  }
  inputs.forEach(input => input.addEventListener('input', () => {
    clearTimeout(editTimer);
    calculate();
    // Show the new response immediately, then replay after the drag settles.
    editTimer = setTimeout(replay, 160);
  }));
  timeInput.addEventListener('input', () => { clearTimeout(editTimer); stop(); renderTime(); });
  find('[data-reset]').addEventListener('click', () => selectCase(selected));
  find('[data-play]').addEventListener('click', () => { clearTimeout(editTimer); playing ? stop() : play(); });
  find('[data-speed]').addEventListener('click', () => {
    speed = speed === 1 ? 0.25 : 1;
    find('[data-speed]').textContent = speed === 1 ? '1×' : '¼×';
  });
  find('[data-surface]').addEventListener('click', () => {
    clearTimeout(editTimer); parameters.removeSurface = !parameters.removeSurface; calculate(); replay();
  });
  lab.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => selectCase(button.dataset.case)));
  lab.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view; drawPlot(); renderTime();
  }));
  document.querySelectorAll('[data-contact-case]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); selectCase(link.dataset.contactCase); lab.scrollIntoView({ behavior: 'instant', block: 'start' });
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(editTimer); stop(); } });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { clearTimeout(editTimer); stop(); } });
  narrow.addEventListener('change', () => { drawPlot(); renderTime(); });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) { clearTimeout(editTimer); stop(); }
    else if (!entered) { entered = true; if (!reducedMotion.matches) play(); }
  }, { threshold: 0.2 }).observe(find('[data-scene]'));
  selectCase('soft', false);
  find('.lab-fallback').hidden = true;
  find('.lab-live').hidden = false;
  lab.classList.add('lab-ready');
}
