import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const openPack = (page, size) => page.getByRole('button', { name: `Edit ${size} tablets`, exact: true }).click();
const savePack = async (page, reason = 'Reviewed sample configuration') => {
  await page.getByLabel('Change context', { exact: true }).fill(reason);
  await page.getByRole('button', { name: 'Save variant', exact: true }).click();
};
test.beforeEach(async ({ page }) => { await page.goto('/app/product.html'); });

test('range visibility depends on listing and sellable packs', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit range', exact: true }).click();
  await page.getByLabel('Listed', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save range', exact: true }).click();
  await expect(page.locator('#visibility')).toHaveText('Not visible');
  await expect(page.locator('#variant-rows .badge.success')).toHaveCount(3);
  await page.getByRole('button', { name: 'Edit range', exact: true }).click();
  await page.getByLabel('Listed', { exact: true }).check();
  await page.getByRole('button', { name: 'Save range', exact: true }).click();
  for (const size of [16, 32, 96]) {
    await openPack(page, size);
    await page.getByLabel('Sellable', { exact: true }).uncheck();
    await savePack(page);
  }
  await expect(page.locator('#visibility')).toHaveText('Not visible');
  await expect(page.locator('#listing-summary')).toHaveText('Listed · 0 sellable variants');
});

test('composite Contributions follow components and edits are attributed', async ({ page }) => {
  await openPack(page, 32);
  await page.getByLabel('Sellable', { exact: true }).uncheck();
  await page.getByLabel('Strength (mg)', { exact: true }).fill('600');
  await savePack(page);
  await expect(page.locator('#variant-error')).toContainText('varies by Size only');
  await page.getByLabel('Strength (mg)', { exact: true }).fill('500');
  await page.getByLabel('Sellable', { exact: true }).check();
  await page.getByLabel('Paracetamol Contribution (tablets)', { exact: true }).fill('30');
  await savePack(page, 'Demonstrate derived Contributions');
  await page.getByText('Sale rules', { exact: true }).click();
  await expect(page.locator('#contribution-rows tr').last()).toContainText('90 tablets');
  await page.getByText('Activity', { exact: true }).click();
  await expect(page.locator('#activity li').first()).toContainText('contribution: 32 → 30');
  await expect(page.locator('#activity li').first()).toContainText('Alex Morgan · Pharmacist');
});

test('GTIN validation rejects a bad check digit and saves a valid identifier', async ({ page }) => {
  await openPack(page, 16);
  await page.getByText('Identifiers, handling & feeds', { exact: true }).click();
  await page.getByLabel('GTIN', { exact: true }).fill('12345671');
  await savePack(page);
  await expect(page.locator('#variant-error')).toContainText('valid GS1 check digit');
  await page.getByLabel('GTIN', { exact: true }).fill('96385074');
  await savePack(page);
  await expect(page.locator('#variant-dialog')).not.toBeVisible();
  await openPack(page, 16);
  await expect(page.getByLabel('GTIN', { exact: true })).toHaveValue('96385074');
});

test('a new pack must have a distinct size and supports scheduled pricing', async ({ page }) => {
  await page.getByRole('button', { name: 'Add variant' }).click();
  await page.getByLabel('Size amount', { exact: true }).fill('16');
  await page.getByLabel('Staff code', { exact: true }).fill('PARA-024');
  await page.getByLabel('Paracetamol Contribution (tablets)', { exact: true }).fill('24');
  await page.getByText('Prices & supplier costs', { exact: true }).click();
  await page.getByLabel('Current web price (£)', { exact: true }).fill('1.10');
  await page.getByLabel('Next web price (£)', { exact: true }).fill('1.20');
  await page.getByLabel('Starts on', { exact: true }).fill('2026-10-01');
  await savePack(page);
  await expect(page.locator('#variant-error')).toContainText('size already exists');
  await page.getByLabel('Size amount', { exact: true }).fill('24');
  await savePack(page);
  await expect(page.locator('#variant-rows')).toContainText('24 tablets');
  await openPack(page, 24);
  await expect(page.getByLabel('Next web price (£)', { exact: true })).toHaveValue('1.2');
});

for (const scheme of ['light', 'dark']) {
  test(`editors are accessible in ${scheme} at pill and square radii`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    for (const radius of ['0', '9999px']) {
      await page.evaluate((r) => document.documentElement.style.setProperty('--radius', r), radius);
      for (const action of ['Edit range', 'Edit 32 tablets']) {
        await page.getByRole('button', { name: action, exact: true }).click();
        if (action === 'Edit 32 tablets') {
          await page.locator('#variant-dialog details').evaluateAll((els) => els.forEach((el) => el.open = true));
        }
        await expect(page.locator('dialog[open]')).toHaveCSS('opacity', '1');
        await page.locator('dialog[open]').evaluate(async (el) => { await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))); });
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
        await page.keyboard.press('Escape');
      }
    }
  });
}

test('membership changes update the buying requirements and Question previews create no Answers', async ({ page }) => {
  await page.getByText('Sale rules', { exact: true }).click();
  await page.getByRole('button', { name: 'Manage membership', exact: true }).click();
  await page.locator('#paracetamol-attached').uncheck();
  await page.locator('#membership-context').fill('Demonstrate range membership independently of commercial caps');
  await page.getByRole('button', { name: 'Save membership', exact: true }).click();
  await expect(page.locator('#buying-summary')).toContainText('No restriction-based identity requirement');
  await expect(page.locator('#no-restriction')).toBeVisible();
  await expect(page.locator('#quantity-caps')).toContainText('6 packs');
  await page.getByText('Question Sets', { exact: true }).click();
  await page.getByRole('button', { name: 'Preview Questions' }).first().click();
  await expect(page.locator('#preview-content')).toContainText('Q-001 · wording v3');
  await expect(page.locator('#preview-content')).toContainText('no Assessment or Answers are created');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Manage Question Sets', exact: true }).click();
  await page.locator('#set-ack').uncheck();
  await page.locator('#set-use').uncheck();
  await page.locator('#sets-context').fill('Demonstrate detaching house Sets');
  await page.getByRole('button', { name: 'Save Question Sets', exact: true }).click();
  await expect(page.locator('#buying-summary')).toContainText('no house questions');
  await expect(page.locator('#question-set-cards')).toContainText('No house Question Sets attached');
});
