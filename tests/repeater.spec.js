// The replacement application keeps Repeater's engine coverage: keys, focus
// and errors belong to a finish when its position changes.
import { test, expect } from './fixtures.js';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const rows = page => page.locator('.repeater > ol > li');
const row = (page, n) => rows(page).nth(n - 1);
const live = page => page.locator('.repeater [aria-live]');

test.beforeEach(async ({ page }) => {
  await page.goto('/app/product.html');
  await button(page, 'Adjust inventory').click();
});

test('adding a finish focuses its name and sets a sensible quantity', async ({ page }) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Add finish', exact: true }).click();
  await expect(rows(page)).toHaveCount(4);
  await expect(row(page, 4).getByLabel('Finish name')).toBeFocused();
  await expect(row(page, 4).getByLabel('New finish in stock')).toHaveValue('0');
  await expect(live(page)).toHaveText('Finish 4 added.');
});

test('moving a finish preserves focus and disables the boundary actions', async ({ page }) => {
  await expect(button(page, 'Move finish 1 up')).toBeDisabled();
  await expect(button(page, 'Move finish 3 down')).toBeDisabled();
  await button(page, 'Move finish 3 up').click();
  await expect(button(page, 'Move finish 2 up')).toBeFocused();
  await expect(row(page, 2).getByLabel('Finish name')).toHaveValue('Clay');
  await expect(live(page)).toHaveText('Finish 3 moved up, now finish 2.');
  await page.keyboard.press('Enter');
  await expect(button(page, 'Move finish 1 down')).toBeFocused();
  await expect(row(page, 1).getByLabel('Finish name')).toHaveValue('Clay');
  await expect(row(page, 1).getByLabel('Finish name')).toHaveAttribute('name', 'inventory.0.name');
});

test('removing focuses the next finish, then the previous, then Add', async ({ page }) => {
  await button(page, 'Remove finish 2').click();
  await expect(rows(page)).toHaveCount(2);
  await expect(button(page, 'Remove finish 2')).toBeFocused();
  await expect(row(page, 2).getByLabel('Finish name')).toHaveValue('Clay');
  await page.keyboard.press('Enter');
  await expect(button(page, 'Remove finish 1')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Add finish', exact: true })).toBeFocused();
  await button(page, 'Save inventory').click();
  await expect(page.locator('.repeater > .error')).toHaveText('Add at least one finish.');
});

test('SKU errors follow their finish through reordering and disappear on removal', async ({ page }) => {
  await row(page, 2).getByLabel('Finish SKU').fill('ARC-SL');
  await button(page, 'Save inventory').click();
  await expect(row(page, 2).getByText('Enter a SKU no other product or finish uses.')).toBeVisible();
  await expect(row(page, 2).getByLabel('Finish SKU')).toHaveAttribute('aria-invalid', 'true');
  await button(page, 'Move finish 2 up').click();
  await expect(row(page, 1).getByText('Enter a SKU no other product or finish uses.')).toBeVisible();
  await expect(row(page, 2).getByLabel('Finish SKU')).not.toHaveAttribute('aria-invalid');
  await button(page, 'Remove finish 1').click();
  await expect(page.getByText('Enter a SKU no other product or finish uses.')).toHaveCount(0);
  await button(page, 'Save inventory').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.demo-finishes tfoot')).toContainText('56');
});

// Dragging by the grip: pointer only, beside the buttons. A mouse drag goes through pointer events in every browser.
const grip = (page, n) => row(page, n).locator('[data-handle]');
// the drawer settled where it opens (it slides in; a cancelled animation is settled too), and tall enough that every finish is clear of its sticky footer
const settle = page => page.getByRole('dialog').evaluate(d => Promise.all(d.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
async function drag(page, from, to, { hold = 0, release = true } = {}) {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await settle(page);
  const g = await grip(page, from).boundingBox(), a = await row(page, from).boundingBox(), b = await row(page, to).boundingBox();
  const by = to < from ? b.y - a.y : b.y + b.height - (a.y + a.height);
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + by, { steps: 12 });
  if (hold) await page.waitForTimeout(hold);
  if (release) await page.mouse.up();
}

test('dragging a finish by its grip moves it and says so, and the grip is hidden from assistive tech', async ({ page }) => {
  await expect(grip(page, 1)).toHaveAttribute('aria-hidden', 'true');
  await expect(grip(page, 1).locator('xpath=ancestor-or-self::*[@tabindex or self::button]')).toHaveCount(0);
  await drag(page, 3, 1);
  await expect(row(page, 1).getByLabel('Finish name')).toHaveValue('Clay');
  await expect(row(page, 1).getByLabel('Finish name')).toHaveAttribute('name', 'inventory.0.name');
  await expect(live(page)).toHaveText('Finish 3 moved up, now finish 1.');
  await drag(page, 1, 2);
  await expect(row(page, 2).getByLabel('Finish name')).toHaveValue('Clay');
  await expect(live(page)).toHaveText('Finish 1 moved down, now finish 2.');
  // nothing is left drawn out of place
  await expect(page.locator('.repeater > ol[data-sorting], .repeater > ol > li[data-dragging], .repeater > ol > li[style*="translate"]')).toHaveCount(0);
});

test('SKU errors follow their finish through a drag', async ({ page }) => {
  await row(page, 2).getByLabel('Finish SKU').fill('ARC-SL');
  await button(page, 'Save inventory').click();
  await expect(row(page, 2).getByLabel('Finish SKU')).toHaveAttribute('aria-invalid', 'true');
  await drag(page, 2, 3);
  await expect(row(page, 3).getByText('Enter a SKU no other product or finish uses.')).toBeVisible();
  await expect(row(page, 2).getByLabel('Finish SKU')).not.toHaveAttribute('aria-invalid');
});

test('Escape puts a dragged finish back and leaves the drawer open', async ({ page }) => {
  const names = () => rows(page).getByLabel('Finish name').evaluateAll(inputs => inputs.map(i => i.value));
  const before = await names();
  await drag(page, 1, 3, { release: false });
  await expect(page.locator('.repeater > ol > li[data-dragging]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await names()).toEqual(before);
  await expect(page.locator('.repeater > ol[data-sorting], .repeater > ol > li[style*="translate"]')).toHaveCount(0);
  await expect(live(page)).toHaveText('');
});

test('a lone finish cannot be dragged', async ({ page }) => {
  await button(page, 'Remove finish 3').click();
  await button(page, 'Remove finish 2').click();
  await expect(grip(page, 1)).toHaveAttribute('data-disabled', 'true');
});

// instant, so an app's scroll-smooth does not turn each frame's step into a glide that never gets going
for (const behaviour of ['auto', 'smooth']) test(`dragging to the edge of a scrolled drawer scrolls it (scroll-behavior: ${behaviour})`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 480 });
  await settle(page);
  await page.evaluate(b => document.querySelectorAll('html, dialog').forEach(el => (el.style.scrollBehavior = b)), behaviour);
  await page.getByRole('dialog').evaluate(d => d.scrollTo({ top: d.scrollHeight, behavior: 'instant' }));
  await expect(grip(page, 3)).toBeInViewport();
  const g = await grip(page, 3).boundingBox(), box = await page.getByRole('dialog').boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, box.y + 8, { steps: 12 });
  await expect.poll(() => page.getByRole('dialog').evaluate(d => d.scrollTop), { timeout: 2000 }).toBe(0);
  await page.waitForTimeout(300);
  await page.mouse.up();
  await expect(row(page, 1).getByLabel('Finish name')).toHaveValue('Clay');
});

test('dragging to the bottom of the drawer scrolls the drawer and never the page behind it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 480 });
  await settle(page);
  const dialog = page.getByRole('dialog'), box = await dialog.boundingBox();
  const g = await grip(page, 1).boundingBox(), before = await page.evaluate(() => scrollY);
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, box.y + box.height - 8, { steps: 12 });
  await expect.poll(() => dialog.evaluate(d => d.scrollHeight - d.clientHeight - d.scrollTop), { timeout: 2000 }).toBeLessThan(1);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.mouse.up();
});
