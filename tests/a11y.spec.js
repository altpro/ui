// WCAG 2.2 AA checks against the demo pages, in both colour schemes.
// axe covers contrast, names, landmarks and the rest of the automatable rules.
// The extra tests cover what axe does not: hover contrast, focus visibility, target size.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["index.html", "button.html", "theme.html"];
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

    test("button.html: every colour and style keeps contrast on hover", async ({ page }) => {
      await page.goto("/button.html");
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const buttons = page.locator("main section:nth-of-type(2) .btn");
      expect(await buttons.count()).toBe(21);
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

    test("button.html: keyboard focus shows a ring", async ({ page }) => {
      await page.goto("/button.html");
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement.matches(".btn"))) break;
      }
      const outline = await page.evaluate(() => {
        const s = getComputedStyle(document.activeElement);
        return { matches: document.activeElement.matches(".btn"), style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
      });
      expect(outline.matches).toBe(true);
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    });

    test("button.html: every button meets the 24px minimum target size", async ({ page }) => {
      await page.goto("/button.html");
      const small = [];
      for (const b of await page.locator("main .btn").all()) {
        const box = await b.boundingBox();
        if (!box || box.width < 24 || box.height < 24) small.push(await b.getAttribute("class"));
      }
      expect(small).toEqual([]);
    });
  });
}
