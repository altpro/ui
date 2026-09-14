// WCAG 2.2 AA checks against the demo pages, in both colour schemes.
// axe covers contrast, names, landmarks and the rest of the automatable rules.
// The extra tests cover what axe does not: hover contrast, focus visibility, target size.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["index.html", "button.html", "join.html", "badge.html", "avatar.html", "nav.html", "dropdown.html", "tooltip.html", "theme.html"];
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
    // dropdowns are closed at load, so axe never sees them: open each, check it, and check it is on screen
    test("dropdown.html: every open dropdown passes axe and stays inside the viewport", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/dropdown.html");
      const failures = [];
      for (const t of await page.locator("main [popovertarget]").all()) {
        await t.scrollIntoViewIfNeeded();
        await t.click();
        const pop = page.locator("#" + (await t.getAttribute("popovertarget")));
        await expect(pop).toBeVisible();
        const box = await pop.boundingBox();
        const off = box.x < 0 || box.y < 0 || box.x + box.width > 800 || box.y + box.height > 500;
        const { violations } = await axe(page).include("#" + (await t.getAttribute("popovertarget"))).analyze();
        if (off || violations.length) failures.push(`${await pop.getAttribute("id")}: ${off ? JSON.stringify(box) : ""} ${summary(violations)}`);
        await page.keyboard.press("Escape");
      }
      expect(failures).toEqual([]);
    });

    test("dropdown.html: a right-edge trigger opens right-aligned and a bottom-edge trigger opens upwards", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/dropdown.html");
      const right = page.locator("[popovertarget=menu-right]");
      await right.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await right.click();
      const [t, p] = [await right.boundingBox(), await page.locator("#menu-right").boundingBox()];
      expect(Math.round(p.x + p.width)).toBe(Math.round(t.x + t.width));
      expect(p.y).toBeGreaterThan(t.y);
      await page.keyboard.press("Escape");

      const bottom = page.locator("[popovertarget=menu-left]");
      await bottom.evaluate((el) => el.scrollIntoView({ block: "end" }));
      await bottom.click();
      const [t2, p2] = [await bottom.boundingBox(), await page.locator("#menu-left").boundingBox()];
      expect(Math.round(p2.x)).toBe(Math.round(t2.x));
      expect(p2.y + p2.height).toBeLessThan(t2.y);
      await page.keyboard.press("Escape");

      // nothing fits: stays down and scrolls inside rather than leaving the viewport
      await page.setViewportSize({ width: 800, height: 150 });
      await bottom.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await bottom.click();
      const [t3, p3] = [await bottom.boundingBox(), await page.locator("#menu-left").boundingBox()];
      expect(p3.y).toBeGreaterThan(t3.y);
      expect(p3.y + p3.height).toBeLessThanOrEqual(150);
    });

    // the bubble is a pseudo-element: it hit-tests as the host, so elementFromPoint above the host finds it
    test("tooltip.html: hover shows a bubble above every host, inside the viewport", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/tooltip.html");
      await page.addStyleTag({ content: "*, ::before, ::after { transition: none !important }" });
      const failures = [];
      for (const t of await page.locator("main [data-tooltip]").all()) {
        await t.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await t.hover();
        const r = await t.evaluate((el) => {
          const s = getComputedStyle(el, "::after"), box = el.getBoundingClientRect();
          const [w, h] = [parseFloat(s.width), parseFloat(s.height)];
          const cx = box.x + box.width / 2;
          return { visibility: s.visibility, w, left: cx - w / 2, right: cx + w / 2, top: box.y - h, hit: document.elementFromPoint(cx, box.y - h / 2) === el };
        });
        const ok = r.visibility === "visible" && r.hit && r.left >= 0 && r.right <= 800 && r.top >= 0;
        if (!ok) failures.push(`${await t.getAttribute("data-tooltip")}: ${JSON.stringify(r)}`);
      }
      expect(failures).toEqual([]);
    });

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
