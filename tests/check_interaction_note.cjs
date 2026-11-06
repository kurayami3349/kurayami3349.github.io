// Run with: node tests/check_interaction_note.cjs
// Check equilibrium cases through the same input events used by the article.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const nodes = {};
for (const [id, value] of Object.entries({ k: 500, ke: 500, delta: 20 })) {
  nodes[id] = { value, addEventListener(event, handler) { this[event] = handler; } };
}
for (const id of ['k-value', 'ke-value', 'delta-value', 'force', 'deformation', 'rigid']) {
  nodes[id] = { value: '' };
}
const demo = {
  querySelector(selector) { return nodes[selector.replace('#contact-', '')]; },
  querySelectorAll() { return [nodes.k, nodes.ke, nodes.delta]; }
};
const code = fs.readFileSync(path.join(__dirname, '../assets/js/interaction-note.js'), 'utf8');
vm.runInNewContext(code, { document: { querySelector: () => demo } });
const result = (id) => Number(nodes[id].value);
const set = (id, value) => { nodes[id].value = value; nodes[id].input(); };

// Equal springs share the 20 mm total deflection equally: 500 N/m × 10 mm = 5 N.
assert.equal(result('force'), 5);
assert.equal(result('deformation'), 10);
assert.equal(result('rigid'), 10);

// A stiffer environment approaches the rigid-wall result from below.
set('ke', 10000);
assert(result('force') > 5 && result('force') < result('rigid'));
assert(result('deformation') < 1);

// Swapping the two springs preserves the force while changing environment deflection.
set('k', 1000);
set('ke', 500);
const force = result('force');
set('k', 500);
set('ke', 1000);
assert.equal(result('force'), force);

// Zero commanded penetration gives zero force and zero deformation.
set('delta', 0);
assert.equal(result('force'), 0);
assert.equal(result('deformation'), 0);
assert.equal(result('rigid'), 0);

// Pages without the demo remain unaffected.
vm.runInNewContext(code, { document: { querySelector: () => null } });
console.log('Contact demo: equilibrium, stiffness limit, symmetry and zero-input checks passed.');
