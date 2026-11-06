// Copyright (c) 2026 qq7r. All Rights Reserved. See LICENSE.
// SI units. One normal degree of freedom; tangential motion is prescribed in the view.
export const defaults = Object.freeze({
  mode: 'impedance', stiffness: 500, damping: 80, environment: 500,
  force: 0, anchor: 0.02, mass: 1, virtualMass: 1, innerHz: 12,
  delay: 0, removeSurface: false, noSurface: false,
  initialPosition: -0.01, initialVelocity: 0, duration: 6, dt: 0.0005
});

export const cases = Object.freeze({
  stiff: { title: '① 位置跟踪：压入表面', stiffness: 2000 },
  soft: { title: '② 降低刚度：相同目标，不同接触力' },
  force: { title: '③ 恒力擦拭：法向 K = 0', stiffness: 0, force: 5, anchor: 0 },
  admittance: { title: '④ 导纳：同时看虚拟与实际位置', mode: 'admittance', stiffness: 0, force: 5, anchor: 0 },
  loss: { title: '⑤ 3 秒时撤去表面', mode: 'admittance', stiffness: 0, force: 5, anchor: 0, removeSurface: true },
  energy: { title: '⑥ 储能与耗散：固定参考、零力前馈', damping: 12 }
});

export function parametersFor(name) {
  if (!cases[name]) throw new Error(`Unknown contact case: ${name}`);
  const { title, ...parameters } = cases[name];
  return { ...defaults, ...parameters };
}

export function surfacePresent(t, p) {
  return !p.noSurface && !(p.removeSurface && t >= 3);
}

export function contactForce(x, t, p) {
  return surfacePresent(t, p) ? p.environment * Math.max(x, 0) : 0;
}

function rk4(state, t, dt, derivative) {
  const a = derivative(state, t);
  const b = derivative(state.map((v, i) => v + dt * a[i] / 2), t + dt / 2);
  const c = derivative(state.map((v, i) => v + dt * b[i] / 2), t + dt / 2);
  const d = derivative(state.map((v, i) => v + dt * c[i]), t + dt);
  return state.map((v, i) => v + dt * (a[i] + 2 * b[i] + 2 * c[i] + d[i]) / 6);
}

export function simulate(overrides = {}) {
  const p = { ...defaults, ...overrides };
  for (const key of ['mass', 'virtualMass', 'environment', 'damping', 'innerHz', 'dt', 'duration']) {
    if (!Number.isFinite(p[key]) || p[key] <= 0) throw new Error(`Expected positive ${key}`);
  }
  for (const key of ['stiffness', 'delay', 'force']) {
    if (!Number.isFinite(p[key]) || p[key] < 0) throw new Error(`Expected nonnegative ${key}`);
  }
  if (!['impedance', 'admittance'].includes(p.mode)) throw new Error('Unknown controller');
  // Motion inner loop: u = K_i (x_v - x) + B_i (v_v - v), with damping ratio 1.
  const omega = 2 * Math.PI * p.innerHz;
  const ki = p.mass * omega ** 2, bi = 2 * p.mass * omega;
  const delaySteps = Math.round(p.delay / p.dt);
  const history = [], points = [];
  let state = [p.initialPosition, p.initialVelocity, p.initialPosition, p.initialVelocity, 0];
  let stopped = false;
  const steps = Math.round(p.duration / p.dt);
  for (let step = 0; step <= steps; step++) {
    const t = step * p.dt;
    const [x, v, xv, vv, dissipated] = state;
    const force = contactForce(x, t, p);
    history.push(force);
    if (step % 10 === 0 || step === steps) {
      const energy = p.mass * v * v / 2 + p.stiffness * (x - p.anchor) ** 2 / 2
        + (surfacePresent(t, p) ? p.environment * Math.max(x, 0) ** 2 / 2 : 0);
      points.push({ t, x, v, xv: p.mode === 'admittance' ? xv : p.anchor, vv,
        force, energy, dissipated, surface: surfacePresent(t, p) });
    }
    if (step === steps) break;
    const heldForce = history[Math.max(0, step - delaySteps)];
    const derivative = (s, stageTime) => {
      const [position, velocity, virtualPosition, virtualVelocity] = s;
      const measured = contactForce(position, stageTime, p);
      if (p.mode === 'impedance') {
        const u = p.force + p.stiffness * (p.anchor - position) - p.damping * velocity;
        return [velocity, (u - measured) / p.mass, 0, 0, p.damping * velocity ** 2];
      }
      const feedback = delaySteps === 0 ? measured : heldForce;
      const av = (p.force - feedback - p.damping * virtualVelocity
        - p.stiffness * (virtualPosition - p.anchor)) / p.virtualMass;
      const u = ki * (virtualPosition - position) + bi * (virtualVelocity - velocity);
      return [velocity, (u - measured) / p.mass, virtualVelocity, av, 0];
    };
    state = rk4(state, t, p.dt, derivative);
    // Stop and expose runaway responses; do not silently clamp a simulated controller.
    if (state.some(v => !Number.isFinite(v)) || Math.abs(state[0]) > 2
        || Math.abs(state[2]) > 2 || Math.abs(state[1]) > 10 || Math.abs(state[3]) > 10) {
      stopped = true;
      break;
    }
  }
  return { parameters: p, points, stopped, innerStiffness: ki, innerDamping: bi };
}
