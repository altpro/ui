// Repeater's drag on repeater.html, where a test can change what an app changes under a drag:
// the rows (a reload), disabled (a save starting), the component itself (a visit away). Plus focus, wheel and touch.
import { test, expect } from './fixtures.js';
const list = page => page.locator('#repeater-lines .repeater');
const rows = page => list(page).locator('> ol > li');
const grip = (page, n) => rows(page).nth(n - 1).locator('[data-handle]');
const products = page => rows(page).getByLabel('Product').evaluateAll(inputs => inputs.map(i => i.value));
const stuck = page => page.locator('#repeater-lines ol[data-sorting], #repeater-lines li[data-dragging], #repeater-lines li[style*="translate"]');
const demo = (page, fn) => page.locator('#repeater-lines').evaluate(fn);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/repeater.html');
  await expect(rows(page)).toHaveCount(2);
});

// press row 1's grip and carry it below row 2 (or `by` pixels), without letting go; after the last drop's glide, so
// the grip is measured where it rests
async function carry(page, by) {
  await rows(page).evaluateAll(lis => Promise.all(lis.flatMap(li => li.getAnimations()).map(a => a.finished.catch(() => {}))));
  const g = await grip(page, 1).boundingBox(), h = (await rows(page).first().boundingBox()).height;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + (by ?? h), { steps: 8 });
  await expect(list(page).locator('li[data-dragging]')).toHaveCount(1);
  return g;
}

test('focus in a field stays there through a drop that moves its row', async ({ page }) => {
  await rows(page).nth(1).getByLabel('Product').focus();
  await carry(page);
  await page.mouse.up();
  await expect(rows(page).first().getByLabel('Product')).toHaveValue('Spare ear pads');
  await expect(rows(page).first().getByLabel('Product')).toBeFocused();
  await rows(page).first().getByLabel('Product').focus();
  await carry(page);
  await page.mouse.up();
  await expect(rows(page).nth(1).getByLabel('Product')).toBeFocused();
});

// as the move buttons do: a move button made disabled by the drop hands focus to its row's other one
test('focus on a move button that the drop disables goes to the row\'s other move button, at either end', async ({ page }) => {
  await list(page).getByRole('button', { name: 'Move line 1 down' }).focus();
  await carry(page);
  await page.mouse.up();
  await expect(list(page).getByRole('button', { name: 'Move line 2 up' })).toBeFocused();
  await list(page).getByRole('button', { name: 'Move line 1 down' }).focus();
  await carry(page);
  await page.mouse.up();
  await expect(list(page).getByRole('button', { name: 'Move line 2 up' })).toBeFocused();
  // and the top: line 2's up button, dragged to the top, is disabled there
  await list(page).getByRole('button', { name: 'Move line 2 up' }).focus();
  await carry(page);
  await page.mouse.up();
  await expect(list(page).getByRole('button', { name: 'Move line 1 down' })).toBeFocused();
});

test('a page whose scrolling the app has locked does not scroll under a drag', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 500 });
  await page.evaluate(() => (document.body.style.overflow = 'hidden'));
  const g = await grip(page, 1).boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, 495, { steps: 8 });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => document.scrollingElement.scrollTop)).toBe(0);
  await page.mouse.up();
});

test('a list in a modal dialog positioned absolute does not scroll the page behind it', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.evaluate(() => {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'position: absolute; inset: 0 auto auto 0; margin: 0; height: 100vh; width: 40rem; overflow: auto';
    dialog.append(document.querySelector('#repeater-lines'));
    document.querySelector('main').append(dialog);
    dialog.showModal();
  });
  const before = await page.evaluate(() => scrollY);
  const g = await grip(page, 1).boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, 595, { steps: 8 });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.mouse.up();
});

test('a disabled fieldset around the list stops the grip as it stops the buttons, and stops a drag under way', async ({ page }) => {
  await page.locator('#repeater-lines').evaluate(el => {
    const fieldset = Object.assign(document.createElement('fieldset'), { id: 'wrap' });
    el.before(fieldset);
    fieldset.append(el);
  });
  await page.locator('#wrap').evaluate(f => (f.disabled = true));
  await expect(list(page).getByRole('button', { name: 'Move line 1 down' })).toBeDisabled();
  const g = await grip(page, 1).boundingBox(), h = (await rows(page).first().boundingBox()).height;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + h, { steps: 8 });
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
  // turned on under a drag: the next move puts it back
  await page.locator('#wrap').evaluate(f => (f.disabled = false));
  await carry(page, 20);
  await page.locator('#wrap').evaluate(f => (f.disabled = true));
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + h, { steps: 4 });
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
});

test('a drag is put back when disabled turns on under it, and the drop changes nothing', async ({ page }) => {
  await carry(page);
  await demo(page, el => (el.demo.disabled.value = true));
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
  await expect(grip(page, 1)).toHaveAttribute('data-disabled', 'true');
});

test('a drag is put back when the rows are replaced under it, and the next drag works', async ({ page }) => {
  await carry(page);
  await demo(page, el => (el.demo.rows.value = el.demo.rows.value.map(r => ({ ...r }))));
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
  await carry(page);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Spare ear pads', 'Studio headphones']);
});

test('a drag is put back when a row is spliced in place under it', async ({ page }) => {
  await carry(page);
  await demo(page, el => el.demo.rows.value.splice(0, 1, { ...el.demo.rows.value[0] }));
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
});

test('a mouse that moves with its button up (the release went elsewhere) puts the drag back, so a later click drops nothing', async ({ page }) => {
  await page.evaluate(() => addEventListener('pointerdown', e => (window.pointer = e.pointerId), { once: true, capture: true }));
  const g = await carry(page);
  await page.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointermove', { pointerId: window.pointer, pointerType: 'mouse', isPrimary: true, buttons: 0, clientX: x, clientY: y })), [g.x, g.y + 300]);
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  await page.getByRole('heading', { level: 1 }).click();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
});

test('the window losing focus puts a drag back', async ({ page }) => {
  await carry(page);
  await page.evaluate(() => dispatchEvent(new Event('blur')));
  await expect(stuck(page)).toHaveCount(0);
  await page.mouse.up();
  expect(await products(page)).toEqual(['Studio headphones', 'Spare ear pads']);
});

test('unmounting mid-drag stops it: no errors, and Escape goes back to the page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await carry(page);
  await demo(page, el => el.__vue_app__.unmount());
  await page.evaluate(() => {
    window.frames = 0;
    const count = () => { window.frames++; };
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = cb => raf(t => { count(); cb(t); });
  });
  const prevented = await page.evaluate(() => new Promise(resolve => {
    addEventListener('keydown', e => resolve(e.defaultPrevented), { once: true });
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  }));
  expect(prevented).toBe(false);
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.frames)).toBe(0);
  expect(errors).toEqual([]);
});

test('a wheel scroll mid-drag keeps the card under the pointer', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.evaluate(() => scrollTo(0, 200));
  // a short carry, so the card has room to follow before the end of the list stops it
  await carry(page, 10);
  const offset = async () => (await grip(page, 1).boundingBox()).y;
  const before = await offset();
  await page.mouse.wheel(0, 60);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  await expect.poll(offset).toBeCloseTo(before, 0);
  await page.mouse.up();
});

test.describe('touch', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP touch input is Chromium only');

  const touch = async (page, type, points) => (page.cdp ??= await page.context().newCDPSession(page)).send('Input.dispatchTouchEvent', { type, touchPoints: points });

  test('a finger drags a row by its grip, and the page does not scroll', async ({ page }) => {
    const g = await grip(page, 1).boundingBox(), h = (await rows(page).first().boundingBox()).height;
    const x = g.x + g.width / 2, y = g.y + g.height / 2;
    await touch(page, 'touchStart', [{ x, y, id: 0 }]);
    for (let i = 1; i <= 8; i++) await touch(page, 'touchMove', [{ x, y: y + (h * i) / 8, id: 0 }]);
    await touch(page, 'touchEnd', []);
    expect(await products(page)).toEqual(['Spare ear pads', 'Studio headphones']);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(stuck(page)).toHaveCount(0);
  });

  test('a second finger on another grip neither ends nor takes over the drag', async ({ page }) => {
    const a = await grip(page, 1).boundingBox(), b = await grip(page, 2).boundingBox(), h = (await rows(page).first().boundingBox()).height;
    const x = a.x + a.width / 2, y = a.y + a.height / 2, other = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 };
    await touch(page, 'touchStart', [{ x, y, id: 0 }]);
    await touch(page, 'touchMove', [{ x, y: y + 10, id: 0 }]);
    await touch(page, 'touchStart', [{ x, y: y + 10, id: 0 }, other]);
    await touch(page, 'touchMove', [{ x, y: y + 10, id: 0 }, { ...other, y: other.y - 200 }]);
    await touch(page, 'touchEnd', [{ ...other, y: other.y - 200 }]); // CDP lifts the points it is given: the second finger
    await expect(list(page).locator('li[data-dragging]')).toHaveCount(1);
    for (let i = 1; i <= 8; i++) await touch(page, 'touchMove', [{ x, y: y + 10 + (h * i) / 8, id: 0 }]);
    await touch(page, 'touchEnd', []);
    expect(await products(page)).toEqual(['Spare ear pads', 'Studio headphones']);
  });
});
