import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { presets, presetMigrations } from '../demo/presets.js';

for (const preset of ['aurora', 'grove', 'atelier', 'claude', 'crms']) {
  for (const colorScheme of ['light', 'dark']) {
    test(`${preset} ${colorScheme}: accessible pages, hover and gradient contrast`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.addInitScript(({ preset, values }) => {
        localStorage.preset = preset;
        localStorage.tokens = Object.entries(values).map(([key, value]) => `${key}: ${value};`).join('');
      }, { preset, values: presets[preset].values });
      for (const path of ['button.html', 'badge.html', 'accordion.html', 'app/product.html']) {
        await page.goto('/' + path);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
        // Axe cannot resolve a gradient: check content against each backdrop stop.
        if (preset === 'crms') {
          for (const stop of ['blue', 'middle', 'rose']) {
            await page.evaluate(stop => {
              document.body.style.backgroundImage = 'none';
              document.body.style.backgroundColor = `var(--demo-backdrop-${stop})`;
            }, stop);
            const solid = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
            expect(solid.violations.map(v => v.nodes.map(n => ({ target: n.target, detail: n.failureSummary })))).toEqual([]);
          }
          await page.evaluate(() => document.body.removeAttribute('style'));
        }
      }
      await page.goto('/button.html');
      await page.addStyleTag({ content: '* { transition: none !important; }' });
      await page.getByRole('button', { name: 'Theme', exact: true }).click();
      expect((await new AxeBuilder({ page }).include('#theme').analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      for (const button of await page.locator('main .btn.primary:not(:disabled):not([aria-disabled])').all()) {
        await button.hover();
        const result = await new AxeBuilder({ page }).include('main').withRules(['color-contrast']).analyze();
        expect(result.violations).toEqual([]);
      }
      // Axe cannot evaluate gradient fills: sample the full sRGB ramp, including hover.
      if (preset === 'aurora') {
        for (const hovered of [false, true]) {
          const button = page.locator('main button.btn.primary:not(.outlined):not(.ghost):not(:disabled)').first();
          await page.mouse.move(0, 0);
          if (hovered) await button.hover();
          const contrast = await button.evaluate((el, hovered) => {
            const style = getComputedStyle(el);
            const probe = document.createElement('span'); el.append(probe);
            const ctx = document.createElement('canvas').getContext('2d');
            const rgb = (color) => {
              probe.style.color = color;
              ctx.fillStyle = getComputedStyle(probe).color;
              ctx.fillRect(0, 0, 1, 1);
              return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
            };
            const luminance = (rgb) => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
            const a = rgb(hovered ? 'var(--btn-hover)' : 'var(--color-primary)');
            const b = rgb('var(--demo-gradient-end)');
            const fg = luminance(rgb(style.color));
            const ratios = Array.from({ length: 101 }, (_, i) => {
              const bg = luminance(a.map((v, j) => v + (b[j] - v) * i / 100));
              return (Math.max(bg, fg) + .05) / (Math.min(bg, fg) + .05);
            });
            probe.remove(); return Math.min(...ratios);
          }, hovered);
          expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
}

test('presets persist, remain editable, export styles and reset completely', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/accordion.html');
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await expect(page.getByLabel('Preset', { exact: true })).toHaveValue('default');
  await page.getByLabel('Preset', { exact: true }).selectOption('aurora');
  await page.getByRole('button', { name: 'Copy CSS' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('linear-gradient');
  await page.getByLabel('primary, light', { exact: true }).fill('#503080');
  await page.getByLabel('Square', { exact: true }).check();
  await page.goto('/app/product.html');
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await expect(page.getByLabel('Preset', { exact: true })).toHaveValue('aurora');
  await expect(page.getByLabel('primary, light', { exact: true })).toHaveValue('#503080');
  await expect(page.getByLabel('Square', { exact: true })).toBeChecked();
  await page.getByLabel('Preset', { exact: true }).selectOption('grove');
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--demo-primary-gradient'))).toBe('');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Preset', { exact: true })).toHaveValue('default');
  expect(await page.evaluate(() => document.documentElement.style.cssText)).toBe('');
});


test('crms saved palette upgrades without replacing custom colours', async ({ page }) => {
  await page.addInitScript(previous => {
    localStorage.preset = 'crms';
    localStorage.tokens = Object.entries({ ...previous, '--color-primary': 'light-dark(#123456, #abcdef)' })
      .map(([key, value]) => `${key}: ${value};`).join('');
  }, presetMigrations.crms);
  await page.goto('/app/product.html');
  await expect(page.locator('#theme-preset')).toHaveValue('crms');
  const saved = await page.evaluate(() => ({
    blue: document.documentElement.style.getPropertyValue('--demo-backdrop-blue'),
    primary: document.documentElement.style.getPropertyValue('--color-primary'),
    storage: localStorage.tokens,
  }));
  expect(saved.blue).toBe(presets.crms.values['--demo-backdrop-blue']);
  expect(saved.primary).toBe('light-dark(#123456, #abcdef)');
  expect(saved.storage).toContain(presets.crms.values['--demo-backdrop-rose']);
});
