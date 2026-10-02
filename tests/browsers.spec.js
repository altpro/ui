// Small engine matrix for the native HTML and CSS features altpro/ui depends on.
// Chromium runs this alongside the detailed accessibility suite; Firefox and
// WebKit run this file only so browser-specific pixel checks stay meaningful.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";

const pages = ["button.html", "field.html", "dropdown.html", "multiselect.html", "dialog.html", "tabs.html", "app/product.html"];
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

// The Blade component rendered by PHP, with the same props as the Vue instance on multiselect.html.
const blade = execFileSync("php", ["tests/blade.php", `<x-ui::multiselect name="size" label="Size" :options="['s' => 'Small', 'm' => 'Medium', 'l' => 'Large']" :selected="['m']" />`], { encoding: "utf8" });
const withBlade = async (page) => {
  await page.goto("/multiselect.html");
  await page.locator("#vue-demo .multiselect").waitFor();
  await page.addStyleTag({ content: "* { transition: none !important }" });
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `<form id="blade">${html}<button class="btn">Save</button></form>`), blade);
  return page.locator("#blade .multiselect");
};

test("multiselect: the Blade and Vue components render the same markup", async ({ page }) => {
  await withBlade(page);
  const [b, v] = await Promise.all(["#blade", "#vue-demo"].map((form) => page.locator(form + " .multiselect").evaluate((el) => {
    // attributes minus the generated id pair, plus live input state (Vue sets checked as a property)
    const shape = (n) => n.nodeType === 3 ? n.data.trim() || null : n.nodeType !== 1 ? null : [
      n.localName,
      [...n.attributes].filter((a) => !["id", "popovertarget", "value", "checked"].includes(a.name)).map((a) => `${a.name}=${a.value}`).sort(),
      n.localName === "input" ? [n.value, n.checked] : [],
      [...n.childNodes].map(shape).filter((x) => x !== null),
    ];
    return { linked: el.querySelector("button").popoverTargetElement === el.querySelector("[popover]"), shape: shape(el) };
  })));
  expect([b.linked, v.linked]).toEqual([true, true]);
  expect(b.shape).toEqual(v.shape);
});

test("multiselect: the button counts ticks and the form sends name[]", async ({ page }) => {
  const ms = await withBlade(page);
  const [button, panel, save] = [ms.locator("button"), ms.locator("[popover]"), page.locator("#blade > .btn")];
  // a second render with two ticks, outside the form
  const two = execFileSync("php", ["tests/blade.php", `<x-ui::multiselect name="other" label="Size" :options="['s' => 'Small', 'm' => 'Medium']" :selected="['s', 'm']" />`], { encoding: "utf8" });
  await page.locator("#blade").evaluate((form, html) => form.insertAdjacentHTML("afterend", `<div id="two">${html}</div>`), two);
  await button.scrollIntoViewIfNeeded();
  // the count badge: inset past the border and its rounded corners (they take the ring colour on focus), short of the chevron
  const badge = async (b = button) => { const r = await b.boundingBox(); return page.screenshot({ clip: { x: r.x + 8, y: r.y + 2, width: r.width - 40, height: r.height - 4 } }); };
  const one = await badge(), twoTicks = await badge(page.locator("#two button"));
  expect(one.equals(twoTicks)).toBe(false); // WebKit drew the same wrong number for both with a CSS counter
  // ticked from code while closed: the change event is what recounts
  await panel.evaluate((p) => { const box = p.querySelector("[value=s]"); box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); });
  expect((await badge()).equals(twoTicks)).toBe(true);
  await button.click();
  await expect(panel).toBeVisible();
  await panel.getByLabel("Small").uncheck();
  await page.keyboard.press("Escape");
  expect((await badge()).equals(one)).toBe(true);

  await button.click();
  await panel.getByLabel("Medium").uncheck();
  await expect(button.locator("span")).toHaveAttribute("data-count", "0");
  await panel.getByLabel("Large").check();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await Promise.all([page.waitForURL(/size%5B%5D=l$/), save.click()]);
});

test("multiselect: keyboard moves between the button and the panel", async ({ page }) => {
  await page.goto("/multiselect.html");
  const button = page.locator("[popovertarget=f-size]");
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.value)).toBe("s");
  await page.keyboard.press("Space");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.locator("#f-size")).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page.locator("#f-size [value=s]")).toBeChecked();
});

test("multiselect: Vue v-model follows the boxes and the count follows v-model", async ({ page }) => {
  const warnings = [];
  page.on("console", (m) => ["warning", "error"].includes(m.type()) && warnings.push(m.text()));
  await page.goto("/multiselect.html");
  const ms = page.locator("#vue-demo .multiselect"), count = ms.locator("button > span"), output = page.locator("#vue-demo output");
  await expect(count).toHaveAttribute("data-count", "1"); // v-model ticks its boxes after the element connects
  await ms.locator("button").click();
  await ms.getByLabel("Small").check();
  await expect(output).toHaveText('v-model: ["m","s"]');
  await expect(count).toHaveAttribute("data-count", "2");
  await page.keyboard.press("Escape");
  await page.locator("#vue-demo").getByRole("button", { name: "Clear" }).click();
  await expect(output).toHaveText("v-model: []");
  await expect(ms.locator("input:checked")).toHaveCount(0);
  await expect(count).toHaveAttribute("data-count", "0");
  expect(warnings).toEqual([]);
});
