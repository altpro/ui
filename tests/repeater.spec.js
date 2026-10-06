// The replacement application keeps Repeater's engine coverage: keys, focus
// and errors belong to a finish when its position changes.
import { test, expect } from '@playwright/test';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const rows = page => page.locator('.repeater > ol > li');
const row = (page, n) => rows(page).nth(n - 1);
const live = page => page.locator('.repeater [aria-live]');

test.beforeEach(async ({ page }) => {
  await page.goto('/app/product.html');
  await button(page, 'Adjust stock').click();
});

test('adding a finish focuses its name and sets a sensible quantity', async ({ page }) => {
  await button(page, 'Add finish').click();
  await expect(rows(page)).toHaveCount(4);
  await expect(row(page, 4).getByLabel('Finish name')).toBeFocused();
  await expect(row(page, 4).getByLabel('New finish available units')).toHaveValue('0');
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
  await expect(button(page, 'Add finish')).toBeFocused();
  await button(page, 'Save inventory').click();
  await expect(page.locator('.repeater > .error')).toHaveText('Add at least one finish.');
});

test('SKU errors follow their finish through reordering and disappear on removal', async ({ page }) => {
  await row(page, 2).getByLabel('Finish SKU').fill('ARC-SL');
  await button(page, 'Save inventory').click();
  await expect(row(page, 2).getByText('Each finish needs a unique SKU.')).toBeVisible();
  await expect(row(page, 2).getByLabel('Finish SKU')).toHaveAttribute('aria-invalid', 'true');
  await button(page, 'Move finish 2 up').click();
  await expect(row(page, 1).getByText('Each finish needs a unique SKU.')).toBeVisible();
  await expect(row(page, 2).getByLabel('Finish SKU')).not.toHaveAttribute('aria-invalid');
  await button(page, 'Remove finish 1').click();
  await expect(page.getByText('Each finish needs a unique SKU.')).toHaveCount(0);
  await button(page, 'Save inventory').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.demo-detail-side .demo-price').last()).toContainText('56');
});
