import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { presets } from '../demo/presets.js';

const scan = async page => {
  await page.locator('dialog[open]').evaluateAll(async dialogs => {
    await Promise.all(dialogs.flatMap(d => d.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
  });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
};

test('catalogue searches, filters, changes layout and paginates', async ({ page }) => {
  await page.goto('/app/products.html');
  await expect(page.getByRole('status')).toHaveText('1–6 of 8 products');
  await page.getByRole('button', { name: 'Next product page' }).click();
  await expect(page.getByRole('status')).toHaveText('7–8 of 8 products');
  await page.getByLabel('Search products', { exact: true }).fill('arc');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await expect(page.locator('.demo-catalogue-grid > a')).toHaveCount(2);
  await page.getByRole('radio', { name: /^Active/ }).check();
  await expect(page.locator('.demo-catalogue-grid > a')).toHaveCount(1);
  await page.getByLabel('Search products', { exact: true }).fill('nothing like this');
  await expect(page.getByRole('heading', { name: 'No products match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Table view' }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Inventory', { exact: true }).selectOption('low');
  await page.keyboard.press('Escape');
  await expect(page.locator('tbody tr')).toHaveCount(2);
});

test('editing product, price, stock and status updates the collection and history', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Arc wireless headphones');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Arc wireless headphones');
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await page.getByLabel('Retail price', { exact: true }).fill('269.99');
  await page.getByRole('button', { name: 'Save pricing', exact: true }).click();
  await expect(page.locator('.demo-detail-side .demo-price').first()).toContainText('£269.99');
  await page.getByRole('button', { name: 'Adjust stock', exact: true }).click();
  await page.getByLabel('Slate available units', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.locator('.demo-detail-side .demo-price').last()).toContainText('92');
  await page.getByRole('button', { name: 'Active', exact: false }).first().click();
  await page.locator('#status-popover').getByRole('button', { name: 'Draft', exact: true }).click();
  await page.goto('/app/products.html');
  await page.getByLabel('Search products', { exact: true }).fill('Arc wireless');
  for (const text of ['Arc wireless headphones', 'Draft', '92 in stock', '£269.99']) await expect(page.locator('tbody tr')).toContainText(text);
  await page.goto('/app/activity.html');
  await expect(page.locator('.timeline > li').first()).toContainText('Arc wireless headphones draft');
});

test('new products, bulk archive and reset form a complete demo workflow', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Add product', exact: true });
  await drawer.getByLabel('Product name', { exact: true }).fill('Test speaker');
  await drawer.getByLabel('SKU', { exact: true }).fill('FRM-TEST');
  await drawer.getByLabel('Category', { exact: true }).selectOption('Speakers');
  await drawer.getByRole('button', { name: 'Add product', exact: true }).click();
  await page.getByLabel('Search products', { exact: true }).fill('Test speaker');
  await expect(page.locator('tbody tr')).toContainText('Test speaker');
  await page.getByLabel('Select Test speaker', { exact: true }).check();
  await page.getByRole('button', { name: 'Archive selected', exact: true }).click();
  await page.getByRole('button', { name: 'Archive products', exact: true }).click();
  await expect(page.locator('tbody tr')).toContainText('Archived');
  await page.goto('/app/activity.html');
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.goto('/app/products.html');
  await expect(page.getByRole('status')).toHaveText('1–6 of 8 products');
});

test('finishes, preview and notes are interactive and Escape returns focus', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('radio', { name: /Finishes/ }).check();
  await page.getByRole('button', { name: 'Edit Slate finish', exact: true }).click();
  await page.getByLabel('Finish price', { exact: true }).fill('259');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.locator('table tbody tr').first()).toContainText('£259');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeFocused();
  await page.getByRole('radio', { name: 'Activity', exact: true }).check();
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByLabel('Your note', { exact: true }).fill('Ready for the autumn collection.');
  await page.getByRole('dialog').getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(page.locator('.timeline > li').first()).toContainText('Ready for the autumn collection.');
});

test('product images survive navigation and exports contain the filtered collection', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.locator('#product-photo').setInputFiles({
    name: 'arc.svg', mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="12"/></svg>'),
  });
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('.demo-gallery-stage img')).toHaveAttribute('src', /^data:image\/svg\+xml;base64,/);
  await page.goto('/app/products.html');
  await page.getByLabel('Search products', { exact: true }).fill('Arc headphones');
  await expect(page.locator('.demo-thumb img')).toHaveAttribute('src', /^data:image\/svg\+xml;base64,/);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('forma-products.csv');
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString();
  expect(csv).toContain('Arc headphones');
  expect(csv).not.toContain('Mono speaker');
});

test('the sales period takes a preset or two dates and the figures follow it', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  const preset = page.getByLabel('Sales period preset', { exact: true });
  await expect(preset).toHaveValue('Last 7 days');
  await expect(page.locator('.demo-chart-labels > span')).toHaveCount(7);
  await preset.selectOption('Last 30 days');
  await expect(page.getByText('vs. previous 30 days')).toHaveCount(4);
  await page.getByLabel('Sales from', { exact: true }).fill('2026-09-01');
  await page.getByLabel('Sales to', { exact: true }).fill('2026-09-03');
  await expect(preset).toHaveValue('');
  await expect(page.locator('.demo-chart-labels > span')).toHaveText(['Tue', 'Wed', 'Thu']);
  await expect(page.getByRole('img', { name: /^Revenue for 1\D+3 September 2026: £/ })).toBeVisible();
  await expect(page.locator('.demo-categories progress')).toHaveCount(3);
});

for (const preset of ['default', 'sol']) {
  for (const scheme of ['light', 'dark']) {
    test(`${preset} ${scheme}: screens, editors, popovers, square and pill remain accessible`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript(({ preset, values }) => {
        localStorage.preset = preset;
        localStorage.tokens = Object.entries(values).map(([key, value]) => `${key}: ${value};`).join('');
      }, { preset, values: presets[preset].values });
      for (const route of ['dashboard', 'products', 'activity', 'product']) {
        await page.goto(`/app/${route}.html`);
        await scan(page);
      }
      await page.addStyleTag({ content: '* { transition: none !important; }' });
      for (const radius of ['0', '9999px']) {
        await page.evaluate(r => document.documentElement.style.setProperty('--radius', r), radius);
        for (const name of ['Edit product', 'Edit pricing', 'Adjust stock', 'Preview']) {
          await page.getByRole('button', { name, exact: true }).click();
          await scan(page);
          await page.keyboard.press('Escape');
        }
      }
      await page.getByRole('button', { name: 'More product actions' }).click();
      await scan(page);
      await page.keyboard.press('Escape');
      await page.locator('[popovertarget="status-popover"]').click();
      await scan(page);
    });
  }
}

test('mobile sidebar and responsive screens work without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['dashboard', 'products', 'product', 'activity']) {
    await page.goto(`/app/${route}.html`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByLabel('Toggle sidebar', { exact: true }).check();
    await expect(page.locator('#sidebar')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).toBeHidden();
    await scan(page);
  }
});
