// Small engine matrix for the native HTML and CSS features nui depends on.
// Chromium runs this alongside the detailed accessibility suite; Firefox and
// WebKit run this file only so browser-specific pixel checks stay meaningful.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["button.html", "field.html", "dropdown.html", "dialog.html", "tabs.html", "app/product.html"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const colorScheme of ["light", "dark"]) {
  for (const path of pages) {
    test(`${path} passes an ${colorScheme} engine smoke scan`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/" + path);
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
}

test("native disclosure and popover interactions work", async ({ page }) => {
  await page.goto("/accordion.html");
  const disclosure = page.locator("main details").nth(1);
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  await page.goto("/dropdown.html");
  const trigger = page.locator("main [popovertarget]").first();
  const target = page.locator("#" + await trigger.getAttribute("popovertarget"));
  await trigger.click();
  await expect(target).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(target).toBeHidden();
});

test("the sample app tabs expose valid complete panels", async ({ page }) => {
  await page.goto("/app/product.html");
  const tabs = page.locator("main .tabs > label");
  const panels = page.locator("main .tabs > div");
  await expect(tabs).toHaveCount(4);
  await expect(panels).toHaveCount(4);
  for (const tab of await tabs.all()) {
    await tab.click();
    const visiblePanels = await panels.evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== "none").length);
    expect(visiblePanels).toBe(1);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  }
});

for (const radius of ["0", "9999px"]) {
  test(`the sample app fits a mobile viewport at radius ${radius}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/product.html");
    await page.evaluate((value) => document.documentElement.style.setProperty("--radius", value), radius);
    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(widths.document).toBe(widths.viewport);
  });
}

test('product panels and pack editor fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/product.html');
  for (const tab of await page.locator('main .tabs > label').all()) {
    await tab.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
  await page.locator('main .tabs > label').first().click();
  await page.getByRole('button', { name: 'Edit 32 tablets', exact: true }).click();
  const dialog = page.locator('#variant-dialog');
  await expect(dialog).toHaveCSS('opacity', '1');
  await dialog.locator('details').evaluateAll((els) => els.forEach((el) => el.open = true));
  const widths = await dialog.evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }));
  expect(widths.scroll).toBe(widths.client);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Edit 32 tablets', exact: true })).toBeFocused();
});

test('coloured divided card sections reach the edges and keep their content inset', async ({ page }) => {
  await page.goto('/card.html');
  for (const radius of ['0', '0.5rem', '9999px']) {
    for (const padding of ['1rem', '1.5rem']) {
      const boxes = await page.evaluate(({ radius, padding }) => {
        const card = document.createElement('div');
        card.className = 'card divided';
        card.style.cssText = `--radius: ${radius}; --card-p: ${padding};`;
        card.innerHTML = '<header class="bg-muted"><h3>Title</h3></header><p>Body</p><footer class="bg-muted"><span>Footer</span></footer>';
        document.querySelector('main').append(card);
        const rect = el => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        const header = card.querySelector('header'), footer = card.querySelector('footer');
        const result = {
          card: rect(card), header: rect(header), footer: rect(footer),
          title: rect(header.firstElementChild), label: rect(footer.firstElementChild),
          padding: parseFloat(getComputedStyle(card).paddingTop),
          headerRadius: getComputedStyle(header).borderTopLeftRadius,
          footerRadius: getComputedStyle(footer).borderBottomLeftRadius,
        };
        card.remove(); return result;
      }, { radius, padding });
      expect(boxes.header.top).toBeCloseTo(boxes.card.top + 1);
      expect(boxes.footer.bottom).toBeCloseTo(boxes.card.bottom - 1);
      for (const section of [boxes.header, boxes.footer]) {
        expect(section.left).toBeCloseTo(boxes.card.left + 1);
        expect(section.right).toBeCloseTo(boxes.card.right - 1);
      }
      expect(boxes.title.top - boxes.header.top).toBeCloseTo(boxes.padding);
      expect(boxes.footer.bottom - boxes.label.bottom).toBeCloseTo(boxes.padding);
      expect(boxes.headerRadius).toBe(boxes.footerRadius);
    }
  }
});
