// Run with: node tests/check_interaction_note.cjs
// Check the article's physical claims independently of its display code.
const assert = require('node:assert/strict');

const close = (actual, expected, tolerance, label) =>
  assert(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, got ${actual}`);

(async () => {
  const { simulate, parametersFor, cases } = await import('../assets/notes/robot-interaction-control/contact-model.mjs');
  const results = Object.fromEntries(Object.keys(cases).map(name => [name, simulate(parametersFor(name))]));
  for (const [name, result] of Object.entries(results)) {
    assert.equal(result.stopped, false, `${name} completes`);
    assert.equal(result.points.at(-1).t, 6);
    assert(result.points.every(p => p.force >= 0), `${name}: unilateral surface cannot pull`);
  }
  // Two springs in series: K K_e / (K + K_e) times commanded penetration.
  close(results.soft.points.at(-1).force, 5, 1e-6, 'equal springs');
  close(results.stiff.points.at(-1).force, 8, 1e-6, 'stiffer robot');
  const a = simulate({ stiffness: 1000, environment: 500 });
  const b = simulate({ stiffness: 500, environment: 1000 });
  close(a.points.at(-1).force, b.points.at(-1).force, 1e-6, 'series-spring symmetry');
  assert(a.points.at(-1).x > b.points.at(-1).x);
  const rigidLimit = simulate({ environment: 10000 });
  assert(rigidLimit.points.at(-1).force > 5 && rigidLimit.points.at(-1).force < 10);

  // Zero stiffness reaches the force target in both architectures.
  close(results.force.points.at(-1).force, 5, 1e-6, 'force feedforward');
  const admittance = results.admittance, last = admittance.points.at(-1);
  close(last.force, 5, 1e-6, 'admittance force target');
  close(last.xv - last.x, 5 / admittance.innerStiffness, 1e-8, 'finite inner-loop offset');

  // With the surface absent, virtual velocity and position have a closed form.
  const free = simulate({ ...parametersFor('admittance'), noSurface: true,
    damping: 20, virtualMass: 2, initialVelocity: -0.03 });
  for (const p of free.points) {
    const decay = Math.exp(-10 * p.t), terminal = 5 / 20;
    const velocity = terminal + (-0.03 - terminal) * decay;
    const position = -0.01 + terminal * p.t + (-0.03 - terminal) / 10 * (1 - decay);
    close(p.vv, velocity, 1e-9, 'analytic free-space velocity');
    close(p.xv, position, 1e-9, 'analytic free-space position');
    assert.equal(p.force, 0);
  }
  const loss = results.loss;
  assert(loss.points.find(p => p.t === 2.5).force > 4.9);
  assert(loss.points.filter(p => p.t >= 3).every(p => !p.surface && p.force === 0));
  close(loss.points.at(-1).vv, 0.0625, 1e-8, 'surface loss terminal speed');
  const restoredSpring = simulate({ ...parametersFor('loss'), stiffness: 500 });
  close(restoredSpring.points.at(-1).xv, 0.01, 1e-8, 'free-space virtual equilibrium');

  // No forcing at rest remains at rest, including the virtual state.
  for (const mode of ['impedance', 'admittance']) {
    const rest = simulate({ mode, initialPosition: 0, anchor: 0 });
    assert(rest.points.every(p => p.x === 0 && p.v === 0 && p.xv === 0 && p.force === 0));
  }

  // Fixed reference and zero force input: include the environment spring energy.
  const energy = results.energy.points, initial = energy[0].energy;
  for (let i = 0; i < energy.length; i++) {
    close(energy[i].energy + energy[i].dissipated, initial, 2e-6, 'energy balance');
    if (i) {
      assert(energy[i].energy <= energy[i - 1].energy + 1e-8, 'stored energy decreases');
      assert(energy[i].dissipated >= energy[i - 1].dissipated, 'dissipation accumulates');
    }
  }

  // Delay changes the response; reducing dt preserves the contact-loss response.
  const delayed = simulate({ ...parametersFor('admittance'), delay: 0.02 });
  assert(delayed.points.some((p, i) => Math.abs(p.x - admittance.points[i].x) > 1e-5));
  const refined = simulate({ ...parametersFor('loss'), dt: 0.00025 });
  close(refined.points.at(-1).x, loss.points.at(-1).x, 1e-5, 'step refinement');

  // Runaway motion is reported, rather than being silently clamped.
  const runaway = simulate({ ...parametersFor('admittance'), noSurface: true,
    force: 15, damping: 5, virtualMass: 0.25 });
  assert(runaway.stopped && runaway.points.at(-1).t < 6);
  assert(runaway.points.at(-1).x > 1.9);
  assert.throws(() => simulate({ virtualMass: 0 }), /positive virtualMass/);
  assert.throws(() => simulate({ delay: -1 }), /nonnegative delay/);
  console.log('Contact model: six presets, equilibrium, analytic free motion, contact loss, energy, delay and numerical checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
