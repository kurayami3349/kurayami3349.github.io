(() => {
  const demo = document.querySelector('.interaction-note .contact-demo');
  if (!demo) return;
  const field = (name) => demo.querySelector(`#contact-${name}`);
  const update = () => {
    const stiffness = Number(field('k').value);
    const environment = Number(field('ke').value);
    const distanceMm = Number(field('delta').value);
    const force = stiffness * environment / (stiffness + environment) * distanceMm / 1000;
    field('k-value').value = `${stiffness} N/m`;
    field('ke-value').value = `${environment} N/m`;
    field('delta-value').value = `${distanceMm} mm`;
    field('force').value = force.toFixed(2);
    field('deformation').value = (force / environment * 1000).toFixed(2);
    field('rigid').value = (stiffness * distanceMm / 1000).toFixed(2);
  };
  demo.querySelectorAll('input').forEach((input) => input.addEventListener('input', update));
  update();
})();
