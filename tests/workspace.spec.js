import { test, expect } from './fixtures.js';
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
  await expect(page.getByLabel('Search products', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Table view' }).click();
  await page.getByRole('combobox', { name: 'Stock level', exact: true }).selectOption('low');
  await expect(page.locator('tbody tr')).toHaveCount(3);
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
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.getByLabel('Slate in stock', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.locator('.demo-finishes tfoot')).toContainText('92');
  await page.getByRole('button', { name: 'Active', exact: false }).first().click();
  await page.locator('#status-popover').getByRole('button', { name: 'Draft', exact: true }).click();
  await page.getByRole('button', { name: 'Move to draft', exact: true }).click();
  await page.goto('/app/products.html');
  await page.getByLabel('Search products', { exact: true }).fill('Arc wireless');
  for (const text of ['Arc wireless headphones', 'Draft', '92 in stock', '£269.99']) await expect(page.locator('tbody tr')).toContainText(text);
  await page.goto('/app/activity.html');
  await expect(page.locator('.timeline > li').first()).toContainText('Arc wireless headphones moved to draft');
});

test('new products, bulk archive and reset form a complete demo workflow', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Add product', exact: true });
  await drawer.getByLabel('Product name', { exact: true }).fill('Test speaker');
  await drawer.getByLabel('SKU', { exact: true }).fill('FRM-TEST');
  await drawer.getByLabel('Category', { exact: true }).selectOption('Speakers');
  await drawer.getByLabel('Retail price', { exact: true }).fill('149');
  await drawer.getByLabel('Cost per item', { exact: true }).fill('60');
  await drawer.getByLabel('Finish name', { exact: true }).fill('Slate');
  await drawer.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test speaker');
  await page.goto('/app/products.html');
  await page.getByLabel('Search products', { exact: true }).fill('Test speaker');
  await expect(page.locator('tbody tr')).toContainText('Test speaker');
  await page.getByLabel('Select Test speaker', { exact: true }).check();
  await page.getByRole('button', { name: 'Archive selected', exact: true }).click();
  await page.getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.locator('tbody tr')).toContainText('Archived');
  await page.goto('/app/activity.html');
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.goto('/app/products.html');
  await expect(page.getByRole('status')).toHaveText('1–6 of 8 products');
});

test('finishes, preview and notes are interactive and Escape returns focus', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit Slate finish', exact: true }).click();
  await page.getByLabel('Finish price', { exact: true }).fill('259');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.locator('table tbody tr').first()).toContainText('£259');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeFocused();
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
  await expect(page.getByRole('heading', { level: 1 }).locator('xpath=following-sibling::p')).toContainText('compared with the previous 30 days');
  // the dates show once Custom range is picked
  await expect(page.getByLabel('Sales from', { exact: true })).toBeHidden();
  await preset.selectOption('');
  await page.getByLabel('Sales from', { exact: true }).fill('2026-09-01');
  await page.getByLabel('Sales to', { exact: true }).fill('2026-09-03');
  await expect(preset).toHaveValue('');
  await expect(page.locator('.demo-chart-labels > span')).toHaveText(['Tue', 'Wed', 'Thu']);
  await expect(page.getByRole('img', { name: /^Sales for 1\D+3 September 2026: £/ })).toBeVisible();
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
        for (const name of ['Edit product', 'Edit pricing', 'Adjust inventory', 'Preview']) {
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

test('an unknown product id shows a not-found state instead of another product', async ({ page }) => {
  await page.goto('/app/product.html?id=no-such-product');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Product not found');
  await expect(page.getByRole('button', { name: 'Edit product', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to all products', exact: true }).click();
  await expect(page).toHaveURL(/products\.html$/);
});

test('channel switches belong to their product and survive a reload', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  const online = page.getByRole('switch', { name: 'Online store availability', exact: true });
  await online.uncheck({ force: true });
  await expect(page.locator('.toaster')).toContainText('No longer on sale in the online store');
  await expect(page.locator('[aria-labelledby="availability-heading"] > p')).toHaveText('Hidden online. Available at the London studio only.');
  await page.reload();
  await expect(online).not.toBeChecked();
  await page.goto('/app/product.html?id=dot');
  await expect(online).toBeChecked();
});

test('a duplicate opens as its own product, with no stock of its own', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'More product actions' }).click();
  await page.getByRole('button', { name: 'Duplicate product', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Arc headphones (copy)');
  await expect(page.locator('.demo-finishes tfoot')).toContainText('0');
});

test('on a phone the filters move into a popover that holds every filter and the sort', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/app/products.html');
  await expect(page.getByRole('combobox', { name: 'Product category', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.locator('#filter-stock').selectOption('low');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Filters/ })).toContainText('1');
  await expect(page.locator('tbody tr')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('saving nothing records nothing, and a real change says what moved', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  const entries = await page.locator('.timeline > li').count();
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await expect(page.getByLabel('Retail price', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Save pricing', exact: true }).click();
  await expect(page.locator('.timeline > li')).toHaveCount(entries);
  await expect(page.locator('.toaster .alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await page.getByLabel('Cost per item', { exact: true }).fill('120');
  await page.getByRole('button', { name: 'Save pricing', exact: true }).click();
  await expect(page.locator('.timeline > li').first()).toContainText('Cost per item changed from £112 to £120.');
});

test('history names what moved in each editor', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  const latest = page.locator('.timeline > li').first();
  await page.getByRole('button', { name: 'Edit Slate finish', exact: true }).click();
  await page.getByLabel('Finish price', { exact: true }).fill('259');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(latest).toContainText('Slate price changed from £249 to £259.');
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.getByLabel('Chalk in stock', { exact: true }).fill('32');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(latest).toContainText('Chalk stock changed from 28 to 32.');
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.locator('[name="inventory.1.name"]').fill('Bone');
  await page.locator('[name="inventory.1.sku"]').fill('ARC-BN');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(latest).toContainText('Chalk renamed Bone. Bone SKU changed from ARC-CH to ARC-BN.');
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add finish', exact: true }).click();
  await expect(page.getByLabel('New finish price', { exact: true })).toHaveValue('');
  await page.locator('[name="inventory.3.name"]').fill('Moss');
  await page.locator('[name="inventory.3.sku"]').fill('ARC-MS');
  await page.getByLabel('Moss price', { exact: true }).fill('269');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(latest).toContainText('Moss added at £269 with 0 in stock.');
  await page.getByRole('button', { name: 'Edit description', exact: true }).click();
  await page.locator('textarea[name=description]').fill('Short and plain.');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(latest).toContainText('Alex Morgan changed the description.');
});

test('search reaches a finish SKU and an empty tab says what belongs there', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByLabel('Search products', { exact: true }).fill(' ARC-CH ');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('Chalk · ARC-CH');
  await expect(page.locator('tbody tr')).toContainText('28 in stock');
  await page.getByLabel('Search products', { exact: true }).fill('Chalk');
  await page.getByRole('combobox', { name: 'Sort products', exact: true }).selectOption('stock-low');
  await expect(page.locator('tbody tr').first()).toContainText('Loop turntable');
  await expect(page.locator('tbody tr').last()).toContainText('64 in stock');
  await page.getByRole('combobox', { name: 'Sort products', exact: true }).selectOption('name');
  await page.getByLabel('Search products', { exact: true }).fill('ARC-CH');
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await expect(page.locator('.demo-catalogue-grid > a')).toContainText('Chalk · ARC-CH');
  await page.getByRole('button', { name: 'Table view' }).click();
  await page.getByLabel('Search products', { exact: true }).fill('');
  await page.getByRole('radio', { name: /^Draft/ }).check();
  await page.locator('tbody .demo-title-link').first().click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.goto('/app/products.html?status=Draft');
  await expect(page.getByRole('heading', { name: 'No draft products' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Clear/ })).toHaveCount(0);
});

test('one day has no line, a month thins its phone labels, and a custom range never passes today', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  const preset = page.getByLabel('Sales period preset', { exact: true });
  await preset.selectOption('Today');
  await expect(page.locator('.demo-chart-line')).toHaveCount(0);
  await expect(page.locator('.demo-chart-bar-value')).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const selector of ['.demo-chart-bar-value', '.demo-chart-labels > span']) {
    const [left, right] = await page.locator(selector).evaluateAll(els => els.map(el => el.getBoundingClientRect()).map(({ left, right }) => ({ left, right })));
    expect(right.left).toBeGreaterThan(left.right + 8);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('.demo-chart-tip')).toHaveCount(0);
  await expect(page.locator('.demo-revenue .demo-card-footer')).toContainText('Same day last week');
  await preset.selectOption('This month');
  await preset.selectOption('');
  const max = await page.getByLabel('Sales to', { exact: true }).getAttribute('max');
  expect(await page.getByLabel('Sales to', { exact: true }).inputValue()).toBe(max);
  await page.setViewportSize({ width: 390, height: 844 });
  await preset.selectOption('Last 30 days');
  const boxes = await page.locator('.demo-chart-labels > span:visible').evaluateAll(spans => spans.map(el => el.getBoundingClientRect()).map(({ left, right }) => ({ left, right })));
  boxes.slice(1).forEach((box, i) => expect(box.left).toBeGreaterThan(boxes[i].right));
});

test('the chart tip stays inside the plot on a phone, and a live region is there before the first key', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/dashboard.html');
  const plot = page.locator('.demo-chart-plot');
  await expect(plot.locator('[aria-live]')).toHaveCount(1);
  await plot.focus();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowLeft');
    const [box, tip] = await Promise.all([plot.boundingBox(), page.locator('.demo-chart-tip').boundingBox()]);
    expect(tip.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(tip.x + tip.width).toBeLessThanOrEqual(box.x + box.width + 1);
  }
});

test('a rename leaves older history readable', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Arc mk2');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('.timeline > li').first()).toContainText('Name changed from Arc headphones to Arc mk2.');
  await expect(page.locator('.timeline > li').nth(1)).toContainText('Description updated');
});

test('focus lands somewhere deliberate when a menu, a dialog or an action goes away', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'More product actions' }).click();
  await page.getByRole('button', { name: 'Archive product', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'More product actions' })).toBeFocused();
  await page.goto('/app/product.html?id=loop');
  await page.locator('.demo-record-actions').getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.getByLabel('Chalk in stock', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Edit product');
  await expect(page.locator('.demo-record-actions .btn.primary')).toBeFocused();
});

test('a draft is archived in words that fit it, and a bad URL falls back', async ({ page }) => {
  await page.goto('/app/product.html?id=arc-pro');
  await page.getByRole('button', { name: 'More product actions' }).click();
  await page.getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('It moves to Archived.');
  await page.getByRole('dialog').getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.locator('.timeline > li').first()).not.toContainText('left the store');
  await page.goto('/app/products.html?page=-1&category=Nope&sort=bad&status=Nope');
  await expect(page.getByRole('status')).toHaveText('1–6 of 8 products');
});

test('the last channel asks before it takes a product off sale, and history titles follow what moved', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  const online = page.getByRole('switch', { name: 'Online store availability', exact: true });
  const studio = page.getByRole('switch', { name: 'London studio availability', exact: true });
  await online.uncheck({ force: true });
  await page.locator('.demo-availability label.switch').last().click();
  await expect(page.getByRole('dialog', { name: /off sale/ })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(studio).toBeChecked();
  await page.locator('.demo-availability label.switch').last().click();
  await page.getByRole('button', { name: 'Take off sale', exact: true }).click();
  await expect(studio).not.toBeChecked();
  await expect(page.locator('.demo-record-title')).toContainText('Off sale');
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Choose channels');
  await page.locator('.demo-record-actions .btn.primary').click();
  await expect(page.locator('.demo-availability')).not.toHaveCSS('box-shadow', 'none');
  // moving between the switches keeps the mark; leaving the card or making the change ends it
  await page.keyboard.press('Tab');
  await expect(page.locator('.demo-availability')).not.toHaveCSS('box-shadow', 'none');
  await page.locator('.demo-record-actions').getByRole('button', { name: 'Edit product', exact: true }).focus();
  await expect(page.locator('.demo-availability')).toHaveCSS('box-shadow', 'none');
  await page.locator('.demo-record-actions .btn.primary').click();
  await page.locator('.demo-availability label.switch').first().click();
  await expect(page.locator('.demo-availability')).toHaveCSS('box-shadow', 'none');
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Edit product');
  await page.locator('.demo-availability label.switch').first().click();
  await page.getByRole('button', { name: 'Take off sale', exact: true }).click();
  expect((await page.locator('.toaster .alert').boundingBox()).height).toBeLessThan(64);
  await page.goto('/app/products.html?view=grid');
  await expect(page.locator('.demo-catalogue-grid > a').first()).toContainText('Off sale');
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.getByLabel('Slate price', { exact: true }).fill('255');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.locator('.timeline > li').first()).toContainText('Price updated');
});

test('a note asks for words inline, and a stock filter leaves when the tab does', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(page.getByText('Enter a note before adding it.')).toBeVisible();
  await page.getByLabel('Your note', { exact: true }).fill('x');
  await expect(page.getByText('Enter a note before adding it.')).toHaveCount(0);
  await page.goto('/app/products.html?status=Active&stock=out');
  await page.getByRole('radio', { name: /^Draft/ }).check();
  await expect(page.getByRole('combobox', { name: 'Stock level', exact: true })).toHaveValue('');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('the pager keeps focus on its last page, and archive names only the channels a product is in', async ({ page }) => {
  await page.goto('/app/products.html');
  const next = page.getByRole('button', { name: 'Next product page' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('7–8 of 8 products');
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('7–8 of 8 products');
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('switch', { name: 'London studio availability', exact: true }).uncheck({ force: true });
  await page.getByRole('button', { name: 'More product actions' }).click();
  await page.getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('It comes off sale in your online store.');
});

test('forms speak with one inline voice, and a new product has an honest empty state', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Add product', exact: true });
  await drawer.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(drawer.getByText('Enter the product name.')).toBeVisible();
  await expect(drawer.getByText('Enter the SKU.')).toBeVisible();
  await expect(drawer.getByText('Enter the retail price.')).toBeVisible();
  await expect(drawer.getByLabel('Product name', { exact: true })).toBeFocused();
  await drawer.getByLabel('Product name', { exact: true }).fill('Plain');
  await expect(drawer.getByText('Enter the product name.')).toHaveCount(0);
  await drawer.getByLabel('SKU', { exact: true }).fill('FRM-PLN');
  await drawer.getByLabel('Finish name', { exact: true }).fill('Slate');
  await drawer.getByLabel('Retail price', { exact: true }).fill('10');
  await drawer.getByLabel('Cost per item', { exact: true }).fill('4');
  await drawer.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.locator('.demo-description')).toContainText('No description yet.');
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await page.getByLabel('Retail price', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save pricing', exact: true }).click();
  await expect(page.getByText('Enter the retail price.')).toBeVisible();
  // a corrected field loses its message at once, on every form
  await page.getByLabel('Retail price', { exact: true }).fill('12');
  await expect(page.getByText('Enter the retail price.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close pricing', exact: true }).click();
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Slate finish', exact: true }).click();
  await page.getByLabel('Finish SKU', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.getByText('Enter the finish SKU.')).toBeVisible();
  await page.getByLabel('Finish SKU', { exact: true }).fill('FRM-ARC-01');
  await expect(page.getByText('Enter the finish SKU.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.getByText('Enter a SKU no other product or finish uses.')).toBeVisible();
  await page.getByLabel('Finish SKU', { exact: true }).fill('PLN-SL');
  await expect(page.getByText('Enter a SKU no other product or finish uses.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close finish editor', exact: true }).click();
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  await page.locator('[name="inventory.0.sku"]').fill('');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.getByText('Enter the finish SKU.').locator('visible=true')).toBeVisible();
  await page.locator('[name="inventory.0.sku"]').fill('PLN-SL');
  await expect(page.getByText('Enter the finish SKU.').locator('visible=true')).toHaveCount(0);
  await page.locator('[name="inventory.0.stock"]').fill('');
  await page.locator('[name="inventory.0.name"]').fill('   ');
  await page.getByRole('button', { name: 'Save inventory' }).click();
  await expect(page.getByText('Enter how many are in stock.')).toBeVisible();
  await expect(page.getByText('Enter the finish name.').locator('visible=true')).toBeVisible();
});

for (const width of [768, 820, 1024, 1100]) {
  test(`at ${width}px the row's code clears the status beside it`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/products.html');
    const clear = await page.locator('tbody tr').evaluateAll(rows => rows.map(row => {
      const code = row.querySelector('.demo-sku').getBoundingClientRect(), status = row.children[2].querySelector('.badge').getBoundingClientRect();
      return code.right <= status.left;
    }));
    expect(clear).toEqual(clear.map(() => true));
  });
}

for (const width of [1100, 1208, 1280, 1366]) {
  test(`at ${width}px the restock queue keeps one toolbar row, a whole placeholder and its stock total`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/app/products.html?status=Active&stock=low');
    const rows = await page.locator('.demo-table-toolbar > :visible').evaluateAll(els => new Set(els.map(el => { const box = el.getBoundingClientRect(); return Math.round(box.top + box.height / 2); })).size);
    expect(rows).toBe(1);
    const fits = await page.getByLabel('Search products', { exact: true }).evaluate(input => {
      const context = document.createElement('canvas').getContext('2d');
      context.font = getComputedStyle(input).font;
      return context.measureText(input.placeholder).width <= input.clientWidth;
    });
    expect(fits).toBe(true);
    await page.goto('/app/product.html?id=arc');
    const total = page.locator('.demo-finishes tfoot td').first();
    expect((await total.boundingBox()).height).toBeLessThan(48);
  });
}

test('a new sort keeps the ticks, and the header box agrees when they are on another page', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.locator('tbody .checkbox').first().check();
  await page.getByRole('combobox', { name: 'Sort products', exact: true }).selectOption('price-high');
  await expect(page.getByRole('button', { name: 'Export 1 selected', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next product page' }).click();
  expect(await page.getByLabel('Select all visible products').evaluate(box => box.indeterminate)).toBe(true);
});

test('a stock filter moves to the Active tab and the count names its base', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByRole('combobox', { name: 'Stock level', exact: true }).selectOption('low');
  await expect(page.getByRole('radio', { name: /^Active/ })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('3 of 6 active products');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
});

test('ticking a row moves nothing, and the list reads as one column of figures on a phone', async ({ page }) => {
  await page.goto('/app/products.html');
  const row = page.locator('tbody tr').nth(2);
  const before = await row.boundingBox();
  await row.locator('.checkbox').check();
  await expect(page.getByRole('button', { name: 'Archive selected', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export 1 selected', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(page.getByLabel('Select all visible products')).toBeFocused();
  await row.locator('.checkbox').check();
  expect((await row.boundingBox()).y).toBe(before.y);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/dashboard.html');
  // the page-level overflow test can't see parts of a card running into each other
  const stacks = await page.locator('.demo-stat').evaluateAll(cards => cards.map(card => {
    const [label, value, change] = [...card.children].map(el => el.getBoundingClientRect());
    return label.bottom <= value.top + 1 && value.bottom <= change.top + 1;
  }));
  expect(stacks).toEqual([true, true, true, true]);
});

test('a toast keeps its message on one row with its icon', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByLabel('Your note', { exact: true }).fill('Check.');
  await page.getByRole('dialog').getByRole('button', { name: 'Add note', exact: true }).click();
  expect((await page.locator('.toaster .alert').boundingBox()).height).toBeLessThan(64);
});

test('a drawer keeps its actions at the very bottom of the screen', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Adjust inventory', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toHaveCSS('opacity', '1');
  const edges = await drawer.evaluate(el => ({ footer: el.querySelector(':scope > footer').getBoundingClientRect().bottom, box: el.getBoundingClientRect().bottom }));
  expect(Math.abs(edges.footer - edges.box)).toBeLessThan(2);
});

test('a dashboard row opens its product and the chart reads out a day', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await expect(page.locator('.demo-low-stock li')).toHaveCount(3);
  const plot = page.locator('.demo-chart-plot');
  await plot.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.demo-chart-tip')).toContainText('£');
  await page.keyboard.press('Escape');
  await expect(page.locator('.demo-chart-tip')).toHaveCount(0);
  await page.locator('.demo-top-products tbody tr').first().click({ position: { x: 400, y: 10 } });
  await expect(page).toHaveURL(/product\.html\?id=/);
});

test('a product leads with what it is waiting for, and archiving always asks', async ({ page }) => {
  await page.goto('/app/product.html?id=loop');
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Adjust inventory');
  await page.goto('/app/product.html?id=arc-pro');
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Publish');
  await expect(page.getByRole('switch', { name: 'Online store availability' })).toBeEnabled();
  await page.locator('[popovertarget="status-popover"]').click();
  await page.locator('#status-popover').getByRole('button', { name: 'Archived', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /^Archive/ })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Archive product', exact: true }).click();
  await expect(page.locator('.demo-record-actions .btn.primary')).toHaveText('Make active');
  await expect(page.getByRole('switch', { name: 'Online store availability' })).toBeDisabled();
});

test('an editor with changes asks before it discards them', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await page.getByLabel('Retail price', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Close pricing', exact: true }).click();
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(page.getByLabel('Retail price', { exact: true })).toHaveValue('300');
  await page.getByRole('dialog', { name: 'Edit pricing' }).getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.demo-pricing .demo-price')).toHaveText('From £249');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit pricing', exact: true }).click();
  await page.getByLabel('Retail price', { exact: true }).fill('300');
  const warned = page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
  expect(await warned).toBe(true);
});

test('finishes keep one SKU each and their totals on the product', async ({ page }) => {
  await page.goto('/app/product.html?id=loop');
  await page.getByRole('button', { name: 'Edit Chalk finish', exact: true }).click();
  await page.getByLabel('Finish price', { exact: true }).fill('289');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.locator('.demo-pricing .demo-price')).toHaveText('£289');
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit Chalk finish', exact: true }).click();
  await page.getByLabel('Finish SKU', { exact: true }).fill('arc-sl');
  await page.getByRole('button', { name: 'Save finish', exact: true }).click();
  await expect(page.getByLabel('Finish SKU', { exact: true })).toBeFocused();
  await expect(page.getByText('Enter a SKU no other product or finish uses.')).toBeVisible();
  await page.goto('/app/product.html?id=dot');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.getByLabel('SKU', { exact: true }).fill('frm-arc-01');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByLabel('SKU', { exact: true })).toBeFocused();
});

test('the list keeps its state in the URL, and the stock link lands worst first', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByRole('link', { name: 'Review stock' }).click();
  await expect(page.locator('tbody tr').first()).toContainText('Orbit turntable');
  await page.goto('/app/products.html');
  await page.getByRole('radio', { name: /^Draft/ }).check();
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await expect(page).toHaveURL(/status=Draft/);
  await page.reload();
  await expect(page.getByRole('radio', { name: /^Draft/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Grid view', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('the way back from a product finds the filtered list', async ({ page }) => {
  await page.goto('/app/products.html');
  await page.getByRole('radio', { name: /^Active/ }).check();
  await page.locator('tbody .demo-title-link').first().click();
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL(/status=Active/);
  await expect(page.getByRole('radio', { name: /^Active/ })).toBeChecked();
});

test('a filtered list reached by a link is still the way back, and the inventory table folds in a narrow column', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByRole('link', { name: 'Review stock' }).click();
  await expect(page).toHaveURL(/products\.html/);
  await page.locator('tbody .demo-title-link').first().click();
  await expect(page).toHaveURL(/product\.html/);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL(/stock=low/);
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto('/app/product.html?id=arc');
  await expect(page.locator('th.demo-finish-sku')).toBeHidden();
  const name = await page.locator('.demo-finishes tbody tr').first().locator('td').first().boundingBox();
  expect(name.width).toBeGreaterThan(100);
});

test('the store preview follows the finish and the channels', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.getByLabel('Finish', { exact: true }).selectOption({ label: 'Clay' });
  await expect(page.getByRole('dialog')).toContainText('£259');
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: 'Online store availability', exact: true }).uncheck({ force: true });
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Not sold online', exact: true })).toBeDisabled();
});

test('renaming a product renames its breadcrumb and tab', async ({ page }) => {
  await page.goto('/app/product.html?id=arc');
  await page.getByRole('button', { name: 'Edit product', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('Arc mk2');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('.breadcrumb [aria-current="page"]')).toHaveText('Arc mk2');
  await expect(page).toHaveTitle('Arc mk2 · Forma');
});

// the default period runs back from today, so typing "to 31 October" is only valid while it starts on or before then
const writtenOn = new Date('2026-11-06T12:00');

test.describe('typing a custom date', () => {
  test.beforeEach(({ page }) => page.clock.setFixedTime(writtenOn));

  // a date field's order comes from the machine, not the page, so learn it and type in that order
  const keysFor = async (page, day, month, year) => {
    const from = page.getByLabel('Sales from', { exact: true });
    await from.focus();
    await page.keyboard.type('02012026');
    const dayFirst = await from.inputValue() === '2026-01-02';
    await page.reload();
    await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
    return dayFirst ? `${day}${month}${year}` : `${month}${day}${year}`;
  };
  for (const [label, day, month, year, heading] of [['Sales from', '03', '09', '2026', '3 September'], ['Sales from', '01', '12', '2025', '1 December 2025'], ['Sales from', '15', '12', '2025', '15 December 2025'], ['Sales to', '31', '10', '2026', '31 October 2026']]) {
    test(`${label} ${day}/${month}/${year} lands on the date typed`, async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', "Linux WebKit's date control isn't Safari's");
      await page.goto('/app/dashboard.html');
      await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
      const keys = await keysFor(page, day, month, year);
      await page.getByLabel(label, { exact: true }).focus();
      await page.keyboard.type(keys);
      await page.getByLabel('Sales period preset', { exact: true }).focus();
      await expect(page.getByRole('heading', { level: 1 }).locator('xpath=following-sibling::p')).toContainText(heading);
      await expect(page.getByRole('alert')).toHaveCount(0);
    });
  }
});

test('a refused date goes back to what the field held, not a date passed through on the way', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium commits each digit, which is the case that broke');
  await page.clock.setFixedTime(writtenOn);
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const to = page.getByLabel('Sales to', { exact: true });
  await to.fill('2026-10-31');
  await to.blur();
  await to.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('01012030');
  await page.getByLabel('Sales period preset', { exact: true }).focus();
  await expect(page.getByRole('alert')).toHaveText('Choose a date up to today.');
  await expect(to).toHaveValue('2026-10-31');
  await expect(page.getByRole('heading', { level: 1 }).locator('xpath=following-sibling::p')).toContainText('31 October 2026');
});

test('a refusal moves nothing, and tabbing on keeps its message', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium commits each digit, which is the case that broke');
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const select = page.getByLabel('Sales period preset', { exact: true });
  const stat = page.locator('.demo-stat').first();
  const [selectBefore, statBefore] = [await select.boundingBox(), await stat.boundingBox()];
  const from = page.getByLabel('Sales from', { exact: true });
  await from.focus();
  await page.keyboard.type('01012030');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('alert')).toHaveText('Choose a date up to today.');
  expect(await select.boundingBox()).toEqual(selectBefore);
  expect(await stat.boundingBox()).toEqual(statBefore);
  await page.keyboard.type('1');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const width of [768, 820, 1024]) {
  test(`at ${width}px the widest range keeps its figures inside their cards`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/app/dashboard.html');
    await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
    await page.getByLabel('Sales from', { exact: true }).fill('2020-01-01');
    await page.getByLabel('Sales from', { exact: true }).blur();
    const fits = await page.locator('.demo-stat-value').evaluateAll(values => values.map(value => {
      const range = document.createRange();
      range.selectNodeContents(value);
      return range.getBoundingClientRect().right <= value.getBoundingClientRect().right + 1;
    }));
    expect(fits).toEqual([true, true, true, true]);
  });
}

test('a phone chart never overprints its labels at any range, and a long range keeps its tip to one line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const to = await page.getByLabel('Sales to', { exact: true }).inputValue();
  for (const days of [9, 10, 15, 20, 30, 45, 90, 400]) {
    const from = new Date(`${to}T12:00`);
    from.setDate(from.getDate() - days + 1);
    await page.getByLabel('Sales from', { exact: true }).fill(from.toLocaleDateString('en-CA'));
    await page.getByLabel('Sales from', { exact: true }).blur();
    const boxes = await page.locator('.demo-chart-labels > span:visible').evaluateAll(spans => spans.map(el => el.getBoundingClientRect()).map(({ left, right }) => ({ left, right })));
    boxes.slice(1).forEach((box, i) => expect(box.left, `${days} days`).toBeGreaterThan(boxes[i].right));
  }
  await page.locator('.demo-chart-plot').focus();
  await page.keyboard.press('ArrowLeft');
  expect((await page.locator('.demo-chart-tip strong').boundingBox()).height).toBeLessThan(24);
  // past a year it plots a month at a time, and says so
  await expect(page.locator('.demo-revenue .demo-card-footer')).toContainText('Best month');
  await expect(page.locator('.demo-chart-tip')).toContainText('a day');
});

test('a range over a year plots calendar months, each once, up to the last one', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const to = await page.getByLabel('Sales to', { exact: true }).inputValue();
  await page.getByLabel('Sales from', { exact: true }).fill('2020-01-01');
  await page.getByLabel('Sales from', { exact: true }).blur();
  const plot = page.locator('.demo-chart-plot');
  await plot.focus();
  const seen = [];
  await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < 90; i++) {
    seen.push((await page.locator('.demo-chart-tip strong span').textContent()).trim());
    await page.keyboard.press('ArrowLeft');
  }
  const months = seen.slice(0, seen.indexOf('Jan 2020') + 1);
  expect(months.length).toBeGreaterThan(70);
  expect(new Set(months).size).toBe(months.length);
  const last = new Date(`${to}T12:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).replace('Sept', 'Sep');
  await expect(page.locator('.demo-chart-labels > span').last()).toHaveText(last);
});

test('a long range plots weeks, and says so', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const to = await page.getByLabel('Sales to', { exact: true }).inputValue();
  const from = new Date(`${to}T12:00`);
  from.setDate(from.getDate() - 139);
  await page.getByLabel('Sales from', { exact: true }).fill(from.toLocaleDateString('en-CA'));
  await page.getByLabel('Sales from', { exact: true }).blur();
  await expect(page.locator('.demo-revenue .demo-card-footer')).toContainText('Best week: Week of');
  await page.locator('.demo-chart-plot').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.demo-chart-tip')).toContainText('Week of');
});

test('Clear in the filter popover hands focus to Done', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/app/products.html');
  await page.getByRole('button', { name: 'Filters' }).click();
  await page.locator('#filter-stock').selectOption('low');
  await page.locator('#product-filters').getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('#product-filters').getByRole('button', { name: 'Done', exact: true })).toBeFocused();
});

test('typing a year into a custom date waits for the whole year', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium commits each digit, which is the case that broke');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  const from = page.getByLabel('Sales from', { exact: true });
  await from.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('2025');
  await expect(page.getByRole('heading', { level: 1 }).locator('xpath=following-sibling::p')).toContainText('2025');
  await expect(page.locator('.demo-stat')).toHaveCount(4);
  await from.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('19');
  await page.getByLabel('Sales to', { exact: true }).focus();
  await expect(from).not.toHaveValue(/^00/);
  await expect(page.locator('.demo-stat')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('a custom range refuses a date before sales began', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  await page.getByLabel('Sales from', { exact: true }).fill('1999-01-01');
  await page.getByLabel('Sales from', { exact: true }).blur();
  await expect(page.getByRole('alert')).toHaveText('Choose a date from 2020 onwards.');
  await expect(page.locator('.demo-stat')).toHaveCount(4);
});

test('a custom range refuses an end before its start', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  await page.getByLabel('Sales period preset', { exact: true }).selectOption('');
  await page.getByLabel('Sales to', { exact: true }).fill('2020-01-01');
  await page.getByLabel('Sales to', { exact: true }).blur();
  await expect(page.getByRole('alert')).toHaveText('The end date must be on or after the start date.');
});

test('figures on the dashboard add up across the period', async ({ page }) => {
  await page.goto('/app/dashboard.html');
  const pounds = text => Number(text.replace(/[^0-9.]/g, ''));
  const revenue = pounds(await page.locator('.demo-stat-value').first().textContent());
  const categories = await page.locator('.demo-categories label .muted.tabular-nums, .demo-categories label .tabular-nums > .muted').allTextContents();
  expect(categories.reduce((sum, c) => sum + pounds(c), 0)).toBe(revenue);
  const shares = await page.locator('.demo-share').allTextContents();
  expect(shares.reduce((sum, c) => sum + pounds(c), 0)).toBe(100);
});

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
