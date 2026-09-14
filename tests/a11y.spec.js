// WCAG 2.2 AA checks against the demo pages, in both colour schemes.
// axe covers contrast, names, landmarks and the rest of the automatable rules.
// The extra tests cover what axe does not: hover contrast, focus visibility, target size.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["index.html", "button.html", "join.html", "badge.html", "avatar.html", "nav.html", "theme.html"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const axe = (page) => new AxeBuilder({ page }).withTags(tags);
const summary = (violations) =>
  violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.any[0]?.data?.contrastRatio ?? ""}`.trim()).join(", ")}`,
  );

for (const colorScheme of ["light", "dark"]) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme });

    for (const p of pages) {
      test(`${p} passes axe`, async ({ page }) => {
        await page.goto("/" + p);
        const { violations } = await axe(page).analyze();
        expect(summary(violations)).toEqual([]);
      });
    }

    // cls also selects nav links, so it is wrapped in :is() where it joins another selector
    for (const [p, cls, count] of [["button.html", ".btn", 21], ["badge.html", ".badge", 21], ["nav.html", ".nav :is(a, summary)", 8]]) {
    test(`${p}: every colour and style keeps contrast on hover`, async ({ page }) => {
      await page.goto("/" + p);
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const buttons = page.locator("main section:nth-of-type(2) " + cls);
      expect(await buttons.count()).toBe(count);
      const failures = [];
      for (const b of await buttons.all()) {
        await b.hover();
        await b.evaluate((el) => el.setAttribute("data-hover", ""));
        const { violations } = await axe(page).include("[data-hover]").analyze();
        if (violations.length) failures.push(`${await b.getAttribute("class")}: ${summary(violations)}`);
        await b.evaluate((el) => el.removeAttribute("data-hover"));
      }
      expect(failures).toEqual([]);
    });

    test(`${p}: keyboard focus shows a ring`, async ({ page }) => {
      await page.goto("/" + p);
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate((cls) => document.activeElement.matches("main " + cls), cls)) break;
      }
      const outline = await page.evaluate((cls) => {
        const s = getComputedStyle(document.activeElement);
        return { matches: document.activeElement.matches("main " + cls), style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
      }, cls);
      expect(outline.matches).toBe(true);
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    });

    test(`${p}: every interactive element meets the 24px minimum target size`, async ({ page }) => {
      await page.goto("/" + p);
      const small = [];
      for (const b of await page.locator(`main :is(a, button):is(${cls})`).all()) {
        if (!(await b.isVisible())) continue; // e.g. inside a closed <details>
        const box = await b.boundingBox();
        if (box.width < 24 || box.height < 24) small.push(await b.textContent());
      }
      expect(small).toEqual([]);
    });
    }
  });
}
