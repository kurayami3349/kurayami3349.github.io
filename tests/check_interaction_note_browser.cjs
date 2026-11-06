// Optional browser check after bash tools/test.sh.
// npm install --prefix /tmp/blog-browser-check playwright
// PLAYWRIGHT_MODULE=/tmp/blog-browser-check/node_modules/playwright node tests/check_interaction_note_browser.cjs
// CHROME_EXECUTABLE and BROWSER_PROXY can select a local browser and network route.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../_site');
const output = path.resolve(__dirname, '../raw/interaction-control-update/visual-demo');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.mjs': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(4391, '127.0.0.1', resolve));
  const args = ['--no-sandbox'];
  if (process.env.BROWSER_PROXY) args.push(`--proxy-server=${process.env.BROWSER_PROXY}`);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE || '/usr/bin/google-chrome', headless: true, args });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], reports = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4391/posts/robot-interaction-control/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.addStyleTag({ content: 'html {scroll-behavior:auto!important;}' });
    const lab = page.locator('#contact-lab');
    await lab.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Number(document.querySelector('#lab-time').value) > 0.05);
    const scrub = value => page.locator('#lab-time').evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    const set = (field, value) => lab.locator(`[data-field="${field}"]`).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    const force = async () => parseFloat(await lab.locator('[data-force]').textContent());
    for (const [name, expected, primary] of [
      ['stiff', 8, 'stiffness'], ['soft', 5, 'stiffness'], ['force', 5, 'force'],
      ['admittance', 5, 'innerHz'], ['loss', 0, 'stiffness'], ['energy', 5, 'damping']
    ]) {
      await lab.locator(`[data-case="${name}"]`).click();
      await scrub(6);
      assert(Math.abs(await force() - expected) < 0.02, `${name}: correct physical result`);
      assert.equal(await lab.locator('[data-primary] input').getAttribute('data-field'), primary);
      assert.equal(await lab.locator('[data-field]:visible').count(), 1, 'one visible parameter');
      assert.equal(await lab.locator('[data-plot] svg').count(), 1, 'one trace');
      assert.equal(await lab.locator('p:visible').count(), 0, 'no explanatory paragraphs inside default demo');
    }
    await lab.locator('[data-case="admittance"]').click();
    await set('innerHz', 3);
    await page.waitForTimeout(400);
    assert(Number(await page.locator('#lab-time').inputValue()) > 0, 'parameter edit replays');
    await scrub(6);
    // The finite inner loop has a visibly separated virtual and real pad at low bandwidth.
    const gap = await lab.locator('[data-scene]').evaluate(el => {
      const ghost = el.querySelector('.lab-ghost');
      const actual = [...el.querySelectorAll('rect')].find(r => r.getAttribute('fill') === 'var(--lab-actual)');
      return Number(ghost.getAttribute('y')) + 16 - Number(actual.getAttribute('y')) - 14;
    });
    assert(gap > 25, 'virtual and actual positions are visibly different');
    await lab.locator('[data-view="force"]').click();
    assert((await lab.locator('[data-plot] svg').getAttribute('aria-label')).includes('接触力'));
    await lab.locator('[data-case="loss"]').click();
    await scrub(2.9); assert(await force() > 4.9);
    await scrub(3.1); assert.equal(await force(), 0);
    assert.equal(await lab.locator('.lab-surface').count(), 0, 'surface visibly disappears');
    await lab.locator('[data-surface]').click();
    await scrub(6); assert(Math.abs(await force() - 5) < 0.02, 'restore surface');
    await lab.locator('[data-case="soft"]').click();
    await scrub(0.2); await lab.locator('[data-play]').click();
    await page.waitForTimeout(200); await lab.locator('[data-play]').click();
    const paused = await page.locator('#lab-time').inputValue();
    await page.waitForTimeout(150); assert.equal(await page.locator('#lab-time').inputValue(), paused);
    await lab.locator('.lab-options summary').click();
    await set('environment', 1000);
    await lab.locator('[data-reset]').click();
    assert.equal(await lab.locator('[data-field="environment"]').inputValue(), '500');
    assert(!(await lab.locator('.lab-options').evaluate(el => el.open)));
    await page.waitForFunction(() => document.querySelectorAll('mjx-container').length > 100);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await lab.locator('[data-case="soft"]').click(); await scrub(0.2);
      const box = await lab.boundingBox(), scene = await lab.locator('[data-scene]').boundingBox();
      assert(box.height < 820, `compact demo: ${box.height}px at ${width}`);
      assert(scene.height > 240, 'scene stays prominent');
      const stats = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, mathErrors: document.querySelectorAll('mjx-merror').length }));
      assert.equal(stats.width, stats.scroll); assert.equal(stats.mathErrors, 0);
      reports.push({ ...stats, demoHeight: box.height, sceneHeight: scene.height });
      await lab.screenshot({ path: path.join(output, `demo-${width}.png`) });
    }
    await lab.locator('[data-case="energy"]').click(); await scrub(0.3);
    await page.evaluate(() => document.documentElement.setAttribute('data-mode', 'dark'));
    await lab.screenshot({ path: path.join(output, 'energy-mobile-dark.png') });
    // Respect reduced-motion settings while retaining explicit playback and scrubbing.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.locator('[data-case="soft"]').click();
    await page.waitForTimeout(250); assert.equal(await page.locator('#lab-time').inputValue(), '0');
    await set('stiffness', 1000); await page.waitForTimeout(350);
    assert.equal(await page.locator('#lab-time').inputValue(), '0');
    await lab.locator('[data-play]').click(); await page.waitForTimeout(250);
    assert(Number(await page.locator('#lab-time').inputValue()) > 0);
    await scrub(6);
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await nojs.newPage();
    await staticPage.goto('http://127.0.0.1:4391/posts/robot-interaction-control/');
    assert(await staticPage.locator('.lab-fallback').isVisible());
    assert(!(await staticPage.locator('.lab-live').isVisible()));
    await nojs.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'browser-check.json'), JSON.stringify({ reports, errors }, null, 2));
    console.log(JSON.stringify({ reports, errors, checks: 'six cases, one visible parameter, autoplay, edit replay, reference separation, contact loss, reset, pause, reduced motion and static fallback' }, null, 2));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
