// Run with Vite on :3000. Uses Playwright installed locally or PLAYWRIGHT_MODULES_DIR.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_MODULES_DIR || '.', 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const base = process.env.MOBILE_TEST_URL || 'http://localhost:3000';
const artifacts = process.env.MOBILE_TEST_ARTIFACTS || '.tmp-mobile-artifacts';
await mkdir(artifacts, { recursive: true });
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
try {
  for (const [width, height] of [[360, 800], [390, 844], [430, 932], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/tests/mobile/pt/`);
    await page.locator('.joystick-base').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const input = async () => JSON.parse(await page.getByLabel('input', { exact: true }).innerText());
    const waitInput = async (expected) => {
      await page.waitForFunction(expected => {
        const current = JSON.parse(document.querySelector('output[aria-label="input"]').textContent || '{}');
        return Object.entries(expected).every(([key, value]) => Math.abs(Number(current[key]) - Number(value)) < .001);
      }, expected);
    };
    const controls = await page.locator('.mobile-controls').boundingBox();
    check(controls.y === height / 2 && controls.y + controls.height === height, 'controls confined to bottom half');
    for (const selector of ['.joystick-base', '.mobile-flight-actions']) {
      const box = await page.locator(selector).boundingBox();
      check(box.y >= height / 2 && box.y + box.height <= height && box.x >= 0 && box.x + box.width <= width, `${selector} fits ${width}x${height}`);
    }
    // CDP sends real touch input, including independent fingers and pointer capture.
    const session = await context.newCDPSession(page);
    const touch = async (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, x, y]) => ({ id, x, y })) });
    const zone = await page.locator('.joystick-zone').boundingBox();
    const x = Math.round(zone.x + zone.width / 2), y = Math.round(zone.y + zone.height / 2);
    const boostBox = await page.getByRole('button', { name: /Turbo:/ }).boundingBox();
    const boost = [2, boostBox.x + boostBox.width / 2, boostBox.y + boostBox.height / 2];
    await touch('touchStart', [[1, x, y]]);
    await waitInput({ x: 0, y: 0, boost: false });
    await touch('touchMove', [[1, x + 2, y - 2]]);
    await waitInput({ x: 0, y: 0 });
    await touch('touchMove', [[1, x, y - 40]]);
    await waitInput({ x: 0, y: -1 });
    await touch('touchStart', [[1, x, y - 40], boost]);
    await waitInput({ y: -1, boost: true });
    await touch('touchEnd', [[1, x, y - 40]]);
    await waitInput({ x: 0, y: 0, boost: true });
    await touch('touchEnd', [boost]);
    await waitInput({ boost: false });
    check(true, 'two fingers retain independent direction/boost ownership');
    await touch('touchStart', [[1, x, y]]);
    await touch('touchMove', [[1, width - 1, y]]);
    await waitInput({ x: 1 });
    await touch('touchCancel', []);
    await waitInput({ x: 0, y: 0, boost: false });
    check(true, 'pointer capture outside zone and touch cancellation reset');
    for (const action of ['blur', 'resize', 'modal', 'unmount']) {
      await touch('touchStart', [[1, x, y]]);
      await touch('touchMove', [[1, x, y - 40]]);
      await waitInput({ y: -1 });
      if (action === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      if (action === 'resize') await page.setViewportSize({ width: width + 1, height });
      if (action === 'modal') await page.getByRole('button', { name: 'settings', exact: true }).click();
      if (action === 'unmount') await page.getByRole('button', { name: 'mount', exact: true }).click();
      await waitInput({ x: 0, y: 0, boost: false });
      await touch('touchEnd', [[1, x, y - 40]]);
      if (action === 'modal') await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
      if (action === 'unmount') await page.getByRole('button', { name: 'mount', exact: true }).click();
      if (action === 'resize') await page.setViewportSize({ width, height });
      check(true, `input clears after ${action}`);
    }
    await page.getByRole('button', { name: /Aproximar e acessar/ }).tap();
    await page.waitForFunction(() => document.querySelector('output[aria-label="docks"]').textContent === '1');
    check(true, 'dock fires once');
    await page.getByRole('button', { name: 'race', exact: true }).click();
    check(await page.getByRole('button', { name: /Aproximar e acessar/ }).count() === 0, 'dock hidden during racing');
    await page.getByRole('button', { name: 'race', exact: true }).click();
    await page.screenshot({ path: path.join(artifacts, `controls-${width}.png`) });
    for (const modal of ['island', 'challenge', 'settings', 'secret']) {
      await page.getByRole('button', { name: modal, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await page.waitForFunction(() => [...document.getAnimations()].every(animation => animation.playState !== 'running'));
      check(await page.locator('.mobile-controls').count() === 0, 'flight input hidden beneath modal');
      const bounds = await dialog.boundingBox();
      check(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1, `${modal} fits viewport`);
      const overflow = await dialog.evaluate(el => el.scrollWidth - el.clientWidth);
      check(overflow <= 1, `${modal} has no horizontal overflow`);
      const close = dialog.getByRole('button', { name: /Fechar/ }).first();
      const closeBox = await close.boundingBox();
      check(closeBox.width >= 44 && closeBox.height >= 44, `${modal} close is at least 44px`);
      await page.screenshot({ path: path.join(artifacts, `${modal}-${width}.png`) });
      // Native swipe must scroll modal content without moving the document.
      const scrollable = await dialog.evaluateHandle(el => [el, ...el.querySelectorAll('*')].find(node =>
        node.scrollHeight > node.clientHeight + 30 && getComputedStyle(node).overflowY === 'auto'));
      if (await scrollable.evaluate(el => Boolean(el))) {
        const scrollBox = await scrollable.asElement().boundingBox();
        const sx = scrollBox.x + scrollBox.width / 2;
        const sy = scrollBox.y + Math.min(scrollBox.height - 12, 220);
        await touch('touchStart', [[7, sx, sy]]);
        for (let step = 1; step <= 8; step++) await touch('touchMove', [[7, sx, sy - step * 12]]);
        await touch('touchEnd', [[7, sx, sy - 96]]);
        await page.waitForFunction(el => el.scrollTop > 0, scrollable);
        check(await page.evaluate(() => window.scrollY === 0), `${modal} swipes scroll content only`);
        await scrollable.evaluate(el => { el.scrollTop = 0; });
      }
      await close.click();
      await dialog.waitFor({ state: 'hidden' });
    }
    await page.getByRole('button', { name: 'language', exact: true }).click();
    await page.getByRole('button', { name: 'Turbo: hold to boost' }).waitFor();
    check((await input()).boost === false, 'locale change preserves neutral state');
    check(errors.length === 0, `no browser errors: ${errors.join('; ')}`);
    console.log(`PASS ${width}x${height}: touch, multitouch, lifecycle, four modals, translation`);
    await context.close();
  }
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${base}/tests/mobile/pt/`);
  await desktop.getByRole('button', { name: 'settings', exact: true }).waitFor();
  check(await desktop.locator('.mobile-controls').count() === 0, 'desktop does not show touch controls');
  await desktop.getByRole('button', { name: 'settings', exact: true }).click();
  const desktopBounds = await desktop.getByRole('dialog').boundingBox();
  check(desktopBounds.width < 1440 && desktopBounds.y > 0, 'desktop retains centered modal');

  if (process.env.MOBILE_TEST_SCENE === '1') {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/pt/`);
    await page.getByRole('button', { name: /Iniciar Exploração com Nave/i }).click({ timeout: 120000 });
    await page.locator('.mobile-controls').waitFor({ timeout: 60000 });
    check(await page.locator('[data-graphics-quality]').getAttribute('data-graphics-quality') === 'low', 'real app starts touch on low quality');
    const canvas = await page.locator('canvas').first().evaluate(el => ({ width: el.width, height: el.height, css: el.getBoundingClientRect().width }));
    check(canvas.width / canvas.css <= 1.25, 'real canvas respects mobile DPR cap');
    const session = await context.newCDPSession(page);
    const touch = async (type, x, y) => session.send('Input.dispatchTouchEvent', { type, touchPoints: [{ id: 1, x, y }] });
    const position = () => page.evaluate(async () => (await import('/src/utils/vehicleTelemetry.ts')).getVehiclePosition());
    for (const [dx, dy, name] of [[0, 40, 'down'], [28.285, -28.285, 'upper-right']]) {
      await touch('touchStart', 105, 710);
      await touch('touchMove', 105 + dx, 710 + dy);
      // Allow reversal inertia to settle, then sample actual physics displacement.
      await page.waitForTimeout(700);
      const from = await position();
      await page.waitForTimeout(600);
      const to = await position();
      await touch('touchEnd', 105 + dx, 710 + dy);
      const worldX = to[0] - from[0], worldZ = to[2] - from[2];
      // Isometric camera sits in world +X/+Z: right = +X/-Z, down = +X/+Z.
      check(name === 'down' ? worldX > 0 && worldZ > 0 : worldZ < 0 && worldX - worldZ > 0 && worldX + worldZ < 0, `real ship follows screen ${name}`);
      console.log(`PASS real scene ${name}: delta X=${worldX.toFixed(2)}, Z=${worldZ.toFixed(2)}`);
    }
    await page.screenshot({ path: path.join(artifacts, 'game-390.png') });
    check(errors.length === 0, `real scene has no browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  console.log(`PASS ${checks} browser checks`);
} finally { await browser.close(); }
