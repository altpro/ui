// WCAG 2.2 AA checks against the demo pages, in both colour schemes.
// axe covers contrast, names, landmarks and the rest of the automatable rules.
// The extra tests cover what axe does not: hover contrast, focus visibility, target size.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";

// vendor pseudo-elements (::-webkit-progress-value, ::-webkit-slider-thumb) are invisible to getComputedStyle,
// so those components are checked by reading pixels back from a screenshot. Playwright PNGs are 8-bit RGBA, unfiltered here.
const pixels = (png) => {
  let i = 8, w, h, bpp, idat = [];
  while (i < png.length) {
    const len = png.readUInt32BE(i), type = png.toString("ascii", i + 4, i + 8), data = png.subarray(i + 8, i + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bpp = data[9] === 6 ? 4 : 3; }
    if (type === "IDAT") idat.push(data);
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1), o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0, b = y ? out[o - stride + x] : 0, c = x >= bpp && y ? out[o - stride + x - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const p = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      out[o + x] = (line[x] + p) & 255;
    }
  }
  return (fx, fy) => { const k = (Math.round(fy * (h - 1)) * w + Math.round(fx * (w - 1))) * bpp; return [...out.subarray(k, k + 3)]; };
};
// a gradient and a solid fill of the same colour can round a channel apart
const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2);
const shot = async (loc) => pixels(await loc.screenshot());

// every demo page, found the way vite.config.js finds them
const pages = readdirSync(new URL("../demo/", import.meta.url), { recursive: true }).filter((f) => f.endsWith(".html")).map((f) => f.replaceAll("\\", "/")).sort();
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

    // the theme drawer is closed at load: open it, check it, and check an edit reaches the page and survives a reload
    test("the theme drawer passes axe, its edits persist and Copy CSS copies them", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/button.html");
      await page.getByRole("button", { name: "Theme" }).click();
      await expect(page.locator("#theme")).toBeVisible();
      const { violations } = await axe(page).include("#theme").analyze();
      expect(summary(violations)).toEqual([]);
      await page.getByLabel("primary, light").fill("#ff0000");
      await page.getByLabel("Pill").check();
      await page.getByRole("button", { name: "Copy CSS" }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^@theme \{\n  --color-primary: light-dark\(#ff0000, #[0-9a-f]{6}\);\n\}\n:root \{\n  --radius: 9999px;\n\}\n$/);
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--radius"))).toBe("9999px");
      expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--color-primary"))).toMatch(/^light-dark\(#ff0000, #[0-9a-f]{6}\)$/);
    });

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
      const right = page.locator("[popovertarget=account-menu]");
      await right.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await right.click();
      const [t, p] = [await right.boundingBox(), await page.locator("#account-menu").boundingBox()];
      expect(Math.round(p.x + p.width)).toBe(Math.round(t.x + t.width));
      expect(p.y).toBeGreaterThan(t.y);
      await page.keyboard.press("Escape");

      const bottom = page.locator("[popovertarget=options-menu]");
      await bottom.evaluate((el) => el.scrollIntoView({ block: "end" }));
      await bottom.click();
      const [t2, p2] = [await bottom.boundingBox(), await page.locator("#options-menu").boundingBox()];
      expect(Math.round(p2.x)).toBe(Math.round(t2.x));
      expect(p2.y + p2.height).toBeLessThan(t2.y);
      await page.keyboard.press("Escape");

      // nothing fits: stays down and scrolls inside rather than leaving the viewport
      await page.setViewportSize({ width: 800, height: 150 });
      await bottom.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await bottom.click();
      const [t3, p3] = [await bottom.boundingBox(), await page.locator("#options-menu").boundingBox()];
      expect(p3.y).toBeGreaterThan(t3.y);
      expect(p3.y + p3.height).toBeLessThanOrEqual(150);
    });

    // panels are closed at load, so axe never sees them: open each, check it, hover every row, and check it is on screen
    test("combobox.html: every open panel passes axe, stays inside the viewport and its rows keep contrast on hover", async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/combobox.html");
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const failures = [];
      for (const t of await page.locator("main .combobox > button[role=combobox]:enabled").all()) {
        const name = await t.getAttribute("aria-label");
        await t.scrollIntoViewIfNeeded();
        await t.click();
        const pop = t.locator("xpath=..").locator("[popover]");
        await expect(pop).toBeVisible();
        await expect(pop.getByText("Searching…")).toHaveCount(0);
        const box = await pop.boundingBox();
        if (box.x < 0 || box.y < 0 || box.x + box.width > 800 || box.y + box.height > 500) failures.push(`${name}: ${JSON.stringify(box)}`);
        const { violations } = await axe(page).include(".combobox > :popover-open").analyze();
        if (violations.length) failures.push(`${name}: ${summary(violations)}`);
        // every row has the same styles, so the first three are enough
        for (const row of (await pop.locator(":is(li, label)").all()).slice(0, 3)) {
          await row.hover();
          await row.evaluate((el) => el.setAttribute("data-hover", ""));
          const { violations } = await axe(page).include("[data-hover]").analyze();
          if (violations.length) failures.push(`${name} ${await row.textContent()} hovered: ${summary(violations)}`);
          await row.evaluate((el) => el.removeAttribute("data-hover"));
        }
        await page.keyboard.press("Escape");
      }
      expect(failures).toEqual([]);
    });

    // toasts are appended after load, so axe never sees them: fire every demo button, check the toast, and check it fits the viewport
    test("toast.html: every toast passes axe, sits inside the viewport, and the timed ones fade", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/toast.html");
      const failures = [];
      for (const b of await page.locator("main [data-toast]").all()) {
        await b.scrollIntoViewIfNeeded();
        await b.click();
        const t = page.locator("#toaster > .alert").last();
        await expect(t).toBeVisible();
        await t.evaluate((el) => Promise.all(el.getAnimations().filter((a) => a.animationName === "toast-in").map((a) => a.finished)));
        const box = await t.boundingBox();
        const off = box.x < 0 || box.y < 0 || box.x + box.width > 800 || box.y + box.height > 500;
        const { violations } = await axe(page).include("#toaster").analyze();
        if (off || violations.length) failures.push(`${await b.textContent()}: ${off ? JSON.stringify(box) : ""} ${summary(violations)}`);
        const names = await t.evaluate((el) => getComputedStyle(el).animationName);
        const pinned = (await t.getAttribute("class")).includes("pinned");
        if (names.includes("toast-life") === pinned) failures.push(`${await b.textContent()}: animation ${names}`);
        await t.evaluate((el) => el.remove());
      }
      expect(failures).toEqual([]);
      // the clock runs out and the app's listener removes the toast; hover pauses it
      await page.locator("main [data-toast]").first().evaluate((b) => { b.click(); document.querySelector("#toaster > .alert").style.setProperty("--toast-life", "0.3s"); });
      const t = page.locator("#toaster > .alert");
      await t.hover();
      await page.waitForTimeout(600);
      await expect(t).toHaveCount(1);
      await page.mouse.move(0, 0);
      await expect(t).toHaveCount(0);
    });

    // dialogs are closed at load, so axe never sees them: open each, check it, and check it fits the viewport
    test("dialog.html: every open dialog passes axe and stays inside the viewport", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/dialog.html");
      await page.addStyleTag({ content: "*, ::backdrop { transition: none !important }" });
      const failures = [];
      for (const t of await page.locator("main [command^=show]").all()) {
        const id = "#" + (await t.getAttribute("commandfor"));
        await t.scrollIntoViewIfNeeded();
        await t.click();
        const d = page.locator(id);
        await expect(d).toBeVisible();
        const box = await d.boundingBox();
        const off = box.x < 0 || box.y < 0 || box.x + box.width > 800 || box.y + box.height > 500;
        const { violations } = await axe(page).include(id).analyze();
        if (off || violations.length) failures.push(`${id}: ${off ? JSON.stringify(box) : ""} ${summary(violations)}`);
        await d.evaluate((el) => (el.matches(":popover-open") ? el.hidePopover() : el.close()));
      }
      expect(failures).toEqual([]);
      // the long one is taller than the viewport, so it must scroll inside rather than grow
      await page.locator("[command=show-modal][commandfor=d-long]").click();
      expect(await page.locator("#d-long").evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    });

    // the closed panel is a 0fr grid row with its padding transitioned away, so it must measure 0; opening one named item closes its sibling
    test("accordion.html: a closed panel has no height and a named group is exclusive", async ({ page }) => {
      await page.goto("/accordion.html");
      await page.addStyleTag({ content: "*, ::details-content { transition: none !important }" });
      const h = (i) => page.locator("main .accordion details").nth(i).evaluate((el) => parseFloat(getComputedStyle(el, "::details-content").height));
      expect(await h(1)).toBe(0);
      expect(await h(0)).toBeGreaterThan(0);
      await page.locator("main .accordion details summary").nth(1).click();
      expect(await h(0)).toBe(0);
      expect(await h(1)).toBeGreaterThan(0);
    });

    // panels are display:none until their label's radio is checked; checking the second label shows the second panel only
    test("tabs.html: checking a radio shows its panel and hides the rest", async ({ page }) => {
      await page.goto("/tabs.html");
      const shown = () => page.locator("main div.tabs").first().evaluate((el) => [...el.children].filter((c) => c.tagName !== "LABEL").map((c) => getComputedStyle(c).display !== "none"));
      expect(await shown()).toEqual([true, false, false]);
      await page.locator("main div.tabs label").nth(1).click();
      expect(await shown()).toEqual([false, true, false]);
      await page.keyboard.press("ArrowRight");
      expect(await shown()).toEqual([false, false, true]);
    });

    // the checked label takes the solid fill; clicking another label moves it, and so does an arrow key
    test("segmented.html: the checked label is filled and arrow keys move the check", async ({ page }) => {
      await page.goto("/segmented.html");
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const labels = page.locator("main [aria-label=Sort] > label");
      const bg = (i) => labels.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
      const filled = await bg(0);
      expect(filled).not.toBe("rgba(0, 0, 0, 0)");
      expect(await bg(1)).toBe("rgba(0, 0, 0, 0)");
      await labels.nth(1).click();
      await page.mouse.move(0, 0);
      expect(await bg(0)).toBe("rgba(0, 0, 0, 0)");
      expect(await bg(1)).toBe(filled);
      await page.keyboard.press("ArrowRight");
      expect(await bg(2)).toBe(filled);
      expect(await labels.nth(2).evaluate((el) => el.querySelector("input").checked)).toBe(true);
    });

    // done and current markers are ::before pseudos coloured by position; the line after a done step is primary too
    test("steps.html: markers before aria-current are done, the current one is bold, the rest are muted", async ({ page }) => {
      await page.goto("/steps.html");
      const li = page.locator("main .steps").first().locator("li");
      const bg = (i, pseudo) => li.nth(i).evaluate((el, ps) => getComputedStyle(el, ps).backgroundColor, pseudo);
      const primary = await page.evaluate(() => { const d = document.createElement("div"); d.style.background = "var(--color-primary)"; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; });
      expect(await bg(0, "::before")).toBe(primary);
      expect(await bg(0, "::after")).toBe(primary);
      expect(await bg(2, "::before")).toBe(primary);
      expect(await bg(2, "::after")).not.toBe(primary);
      expect(await bg(3, "::before")).not.toBe(primary);
      expect(await li.nth(2).evaluate((el) => getComputedStyle(el).fontWeight)).toBe("600");
      // the number comes from the markup, not a CSS counter (WebKit miscounts those); Chromium resolves attr() here
      expect(await li.evaluateAll((els) => els.map((el) => getComputedStyle(el, "::before").content))).toEqual(['"1"', '"2"', '"3"', '"4"']);
      const { violations } = await axe(page).include("main .steps").analyze();
      expect(summary(violations)).toEqual([]);
    });

    // the dot is a ::before pseudo; an avatar first child hides it, colour words recolour it
    test("timeline.html: dots, avatar in place of the dot, coloured dots", async ({ page }) => {
      await page.goto("/timeline.html");
      const lists = page.locator("main .timeline");
      const before = (list, i, prop) => lists.nth(list).locator("li").nth(i).evaluate((el, p) => getComputedStyle(el, "::before")[p], prop);
      const token = (name) => page.evaluate((n) => { const d = document.createElement("div"); d.style.background = `var(--color-${n})`; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; }, name);
      expect(await before(0, 0, "backgroundColor")).toBe(await token("muted-foreground"));
      expect(await before(1, 0, "display")).toBe("none");
      expect(await before(2, 0, "backgroundColor")).toBe(await token("danger"));
      expect(await before(2, 2, "backgroundColor")).toBe(await token("success"));
      const { violations } = await axe(page).include("main .timeline").analyze();
      expect(summary(violations)).toEqual([]);
    });

    // a drawer is full height and flush with one edge; the start one is flush with the other
    test("dialog.html: drawers are full height on their edge", async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.goto("/dialog.html");
      await page.addStyleTag({ content: "*, ::backdrop { transition: none !important }" });
      for (const [id, edge] of [["d-drawer", "right"], ["d-drawer-start", "left"]]) {
        await page.locator(`[commandfor=${id}]`).first().scrollIntoViewIfNeeded();
        await page.locator(`[commandfor=${id}]`).first().click();
        const box = await page.locator("#" + id).boundingBox();
        expect(Math.round(box.height)).toBe(500);
        expect(Math.round(edge === "right" ? box.x + box.width : box.x)).toBe(edge === "right" ? 800 : 0);
        await page.locator("#" + id).evaluate((el) => el.close());
      }
    });

    // the app-shell recipe on a phone: the sidebar is a drawer behind the menu button, in square and pill
    test("app/shell.html: on a phone the sidebar opens as a drawer, traps focus and closes back to the menu button", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 700 });
      await page.goto("/app/shell.html");
      await page.addStyleTag({ content: "*, ::backdrop { transition: none !important }" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const menu = page.getByRole("button", { name: "Open menu" });
      const drawer = page.getByRole("dialog", { name: "Menu" });
      await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
      for (const radius of ["0", "9999px"]) {
        await page.evaluate((r) => document.documentElement.style.setProperty("--radius", r), radius);
        await menu.click();
        await expect(drawer).toBeVisible();
        await expect(drawer.getByRole("navigation", { name: "Main" })).toBeVisible();
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
        expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        const { violations } = await axe(page).analyze();
        expect(summary(violations)).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        await expect(menu).toBeFocused();
      }
      await menu.click();
      await drawer.getByRole("button", { name: "Close menu" }).click();
      await expect(drawer).toBeHidden();
      await expect(menu).toBeFocused();
      // at lg the sidebar is inline and the menu button goes
      await page.setViewportSize({ width: 1280, height: 700 });
      await expect(menu).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      const small = [];
      for (const el of await page.locator("aside :is(a, button):visible, header :is(a, label, button):visible").all()) {
        const box = await el.boundingBox();
        if (box.width < 24 || box.height < 24) small.push(await el.evaluate((e) => e.outerHTML.slice(0, 60)));
      }
      expect(small).toEqual([]);
    });

    // the bubble is a pseudo-element: it hit-tests as the host, so elementFromPoint above the host finds it
    test("tooltip.html: hover shows a bubble above every host, inside the viewport", async ({ page }) => {
      // wide enough for the sidebar: below lg it hides and the first host sits at the page edge, where a centred bubble is off-screen by design
      await page.setViewportSize({ width: 1100, height: 500 });
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
        const ok = r.visibility === "visible" && r.hit && r.left >= 0 && r.right <= 1100 && r.top >= 0;
        if (!ok) failures.push(`${await t.getAttribute("data-tooltip")}: ${JSON.stringify(r)}`);
      }
      expect(failures).toEqual([]);
    });

    // a hidden bubble still counted as overflow, so a host at a dialog's edge made the dialog scroll sideways
    test("tooltip.html: a hidden bubble does not widen its scroll container", async ({ page }) => {
      await page.goto("/tooltip.html");
      const box = await page.evaluate(() => {
        const div = Object.assign(document.createElement("div"), { style: "overflow: auto; width: 10rem; text-align: end" });
        div.innerHTML = `<button class="btn" data-tooltip="A tooltip much wider than its container">x</button>`;
        document.querySelector("main").append(div);
        return { scroll: div.scrollWidth, client: div.clientWidth };
      });
      expect(box.scroll).toBe(box.client);
    });

    // the recipes' server answers arrive after load, so axe never sees them: errors and a toast, then file rows with progress and an error
    test("recipe pages: the error summary, a flash toast, uploading files and the delete dialog pass axe", async ({ page }) => {
      await page.goto("/app/recipe-product.html?id=1");
      await page.getByLabel("Name", { exact: true }).fill("");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.locator("form").getByRole("alert")).toBeFocused();
      expect(summary((await axe(page).analyze()).violations)).toEqual([]);
      await page.getByLabel("Name", { exact: true }).fill("Arc");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.locator("#toaster .alert")).toBeVisible();
      await page.locator("#toaster .alert").evaluate((el) => el.getAnimations().forEach((a) => a.pause()));
      expect(summary((await axe(page).include("#toaster").analyze()).violations)).toEqual([]);

      await page.goto("/app/recipe-media.html?id=1");
      await page.locator("#photos").setInputFiles([
        { name: "front.png", mimeType: "image/png", buffer: Buffer.alloc(1024) },
        { name: "poster.png", mimeType: "image/png", buffer: Buffer.alloc(6 * 1024 * 1024) },
      ]);
      await expect(page.getByRole("progressbar")).toHaveCount(2);
      expect(summary((await axe(page).include(".dropzone").analyze()).violations)).toEqual([]);
      await expect(page.getByText("The photo field must not be greater than 5120 kilobytes.")).toBeVisible();
      expect(summary((await axe(page).include(".dropzone").analyze()).violations)).toEqual([]);

      // the delete-account dialog, open with a wrong password's error in it
      await page.goto("/app/recipe-settings.html");
      await page.locator("section").getByRole("button", { name: "Delete account" }).click();
      const dialog = page.getByRole("dialog", { name: "Delete your account?" });
      await dialog.getByLabel("Password").fill("wrong");
      await dialog.getByRole("button", { name: "Delete account" }).click();
      await expect(dialog.getByText("The password is incorrect.")).toBeVisible();
      expect(summary((await axe(page).include("#delete-account").analyze()).violations)).toEqual([]);
    });

    // row hover is a tint on the cells: hover every body row of a .hover table and check the text still reads
    for (const p of ["table.html", "datatable.html", "app/recipe-products.html"]) test(`${p}: every hovered row keeps contrast`, async ({ page }) => {
      await page.goto("/" + p);
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const rows = page.locator("main .table.hover tbody tr");
      expect(await rows.count()).toBeGreaterThan(3);
      const failures = [];
      for (const r of await rows.all()) {
        await r.hover();
        await r.evaluate((el) => el.setAttribute("data-hover", ""));
        const { violations } = await axe(page).include("[data-hover]").analyze();
        if (violations.length) failures.push(`${await r.textContent()}: ${summary(violations)}`);
        await r.evaluate((el) => el.removeAttribute("data-hover"));
      }
      expect(failures).toEqual([]);
    });

    // the columns panel, a filter panel and the bulk bar are hidden at load, so axe never sees them
    test("datatable.html: the open panels and the bulk bar pass axe", async ({ page }) => {
      await page.goto("/datatable.html");
      for (const name of ["Columns", "Size"]) {
        const button = page.locator(".datatable .controls").getByRole(name === "Size" ? "combobox" : "button", { name, exact: true }).first();
        await button.click();
        const { violations } = await axe(page).include(`[id="${await button.getAttribute("popovertarget")}"]`).analyze();
        expect(summary(violations)).toEqual([]);
        await page.keyboard.press("Escape");
      }
      await page.getByRole("checkbox", { name: /^Select every Products under review/ }).check();
      const { violations } = await axe(page).include(".bulk").analyze();
      expect(summary(violations)).toEqual([]);
    });

    // the bar is a vendor pseudo: its width must follow value/max, and a valueless progress must animate
    test("progress.html: bars are value/max wide, indeterminate sweeps, meter bands colour the bar", async ({ page }) => {
      await page.goto("/progress.html");
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const up = await shot(page.locator("#upload"));
      expect(same(up(0.02, 0.5), up(0.42, 0.5))).toBe(true); // bar runs to 45%
      expect(same(up(0.48, 0.5), up(0.98, 0.5))).toBe(true); // track after it
      expect(same(up(0.42, 0.5), up(0.48, 0.5))).toBe(false);
      // indeterminate: park the stripe in the middle; the UA's own bar must be hidden at the left
      const busy = page.locator("main progress:not([value])").first();
      expect(await busy.evaluate((el) => getComputedStyle(el).animationName)).toBe("progress-sweep");
      await busy.evaluate((el) => { el.style.animation = "none"; el.style.backgroundPosition = "50% 0"; });
      const sweep = await shot(busy);
      expect(same(sweep(0.5, 0.5), up(0.02, 0.5))).toBe(true); // stripe is the fill colour
      expect(same(sweep(0.02, 0.5), up(0.98, 0.5))).toBe(true); // left edge is bare track
      const fill = async (id) => (await shot(page.locator(id)))(0.02, 0.5);
      // bands are the library's own colours, not the UA's green/yellow/red; a colour word pins one colour whatever the band
      expect(same(await fill("#disk"), await fill("main .progress.success"))).toBe(true);
      expect(same(await fill("#disk2"), await fill("main .progress.warning"))).toBe(true);
      expect(same(await fill("#disk3"), await fill("main .progress.danger"))).toBe(true);
      expect(same(await fill("#score"), await fill("main .progress.info"))).toBe(true);
    });

    // the list is empty at load, so axe never sees it: choose files, then show progress, a file error and a field error
    test("file.html: the file list with progress and errors passes axe, and an invalid zone stays red on hover", async ({ page }) => {
      await page.goto("/file.html");
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
      await page.locator("#photos").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: png }, { name: "b.png", mimeType: "image/png", buffer: png }]);
      await page.getByRole("button", { name: "Upload" }).click();
      await expect(page.locator("main .dropzone progress").first()).toBeVisible();
      expect(summary((await axe(page).include("main .dropzone").analyze()).violations)).toEqual([]);
      await expect(page.locator("main .dropzone li .error")).toHaveCount(1);
      await page.getByRole("button", { name: "Show a field error" }).click();
      expect(summary((await axe(page).include("main .dropzone").analyze()).violations)).toEqual([]);
      // an invalid zone stays red on hover
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const zone = page.locator("main .dropzone > label").first();
      const danger = await page.evaluate(() => { const d = document.createElement("div"); d.style.color = "var(--color-danger)"; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
      await expect(zone).toHaveCSS("border-top-color", danger);
      await zone.hover();
      await expect(zone).toHaveCSS("border-top-color", danger);
    });

    // the ring is on the thumb pseudo, not the input, so the shared focus test below cannot see it
    test("range.html: the input is a 24px target and keyboard focus rings the thumb", async ({ page }) => {
      await page.goto("/range.html");
      const r = page.locator("#volume");
      const box = await r.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(24);
      // thumb is 20px on a 24px strip at value 40: sample its centre, the track beside it, and 2px above it where a ring would be
      const cx = (10 + 0.4 * (box.width - 20)) / box.width, above = (box.height / 2 - 12) / box.height;
      const blurred = await shot(r);
      expect(same(blurred(cx, 0.5), blurred(0.9, 0.5))).toBe(false); // thumb differs from track
      expect(same(blurred(0.9, 0.5), blurred(0.9, 0))).toBe(false); // track differs from the strip's background
      await r.focus();
      const focused = await shot(r);
      expect(same(focused(cx, above), blurred(cx, above))).toBe(false); // ring appears round the thumb
      await page.keyboard.press("ArrowRight");
      expect(await r.inputValue()).toBe("41");
      const { violations } = await axe(page).include("#volume").analyze();
      expect(summary(violations)).toEqual([]);
    });

    // a joined member's start border is the divider until focus turns it to the ring, like the other three sides
    for (const p of ["join.html", "segmented.html", "field.html", "pagination.html"]) test(`${p}: a focused member of a .join rings its whole border`, async ({ page }) => {
      await page.goto("/" + p);
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const members = page.locator("main .join > :not(:first-child)");
      const wrong = [];
      let checked = 0;
      for (let i = 0; i < (await members.count()); i++) {
        const m = members.nth(i);
        const target = m.locator("xpath=self::*[self::button or self::a[@href] or self::input or self::select] | .//*[self::button or self::a[@href] or self::input or self::select]").first();
        if (!(await m.isVisible()) || !(await target.count()) || (await target.isDisabled().catch(() => false))) continue;
        await target.focus();
        const sides = await m.evaluate((el) => {
          const s = getComputedStyle(el);
          return el.matches(":focus-visible, :has(:focus-visible)") && s.outlineStyle !== "none" ? [s.borderLeftColor, s.borderTopColor] : null;
        });
        if (sides) checked++;
        if (sides && sides[0] !== sides[1]) wrong.push(`${(await m.evaluate((el) => el.outerHTML)).slice(0, 80)}: start ${sides[0]}, top ${sides[1]}`);
      }
      expect(wrong).toEqual([]);
      expect(checked).toBeGreaterThan(0);
    });

    // an empty control is known only by its edge, which needs 3:1 on whatever it sits on (WCAG 1.4.11); axe does not check it.
    // Paint the backgrounds behind it, then the border, on a canvas: it composites translucent fills for us.
    for (const p of ["field.html", "check.html", "file.html", "combobox.html", "join.html", "table.html", "datatable.html"]) test(`${p}: control borders reach 3:1`, async ({ page }) => {
      await page.goto("/" + p);
      await page.addStyleTag({ content: "* { transition: none !important }" });
      const low = await page.evaluate(() => {
        const x = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
        const paint = (c) => { x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
        const lum = ([r, g, b]) => [r, g, b].map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        const sel = "main :is(.input:not(label), label.input, input:is(.checkbox, .radio, .switch), :is(.checkbox, .radio, .switch) > input, .dropzone > label)";
        return [...document.querySelectorAll(sel)].filter((el) => el.checkVisibility() && !el.matches(":checked, :disabled, :has(:disabled), :focus-within")).flatMap((el) => {
          const fills = [];
          for (let a = el.parentElement; a; a = a.parentElement) {
            fills.unshift(getComputedStyle(a).backgroundColor);
            if (paint(fills[0])[3] === 255) break;
          }
          x.clearRect(0, 0, 1, 1);
          fills.forEach((f) => paint(f));
          const bg = lum([...x.getImageData(0, 0, 1, 1).data]), edge = lum(paint(getComputedStyle(el).borderTopColor));
          const ratio = (Math.max(bg, edge) + 0.05) / (Math.min(bg, edge) + 0.05);
          return ratio < 3 ? [`${el.outerHTML.slice(0, 80)} ${ratio.toFixed(2)}`] : [];
        });
      });
      expect(low).toEqual([]);
    });

    for (const [p, cls, count] of [["button.html", ".btn", 21], ["badge.html", ".badge", 21], ["link.html", ".link", 9], ["nav.html", ".nav :is(a, summary)", 8], ["breadcrumb.html", ".breadcrumb :is(a, button)", 3], ["field.html", ".input", null], ["file.html", ".dropzone > label", 3], ["combobox.html", ".combobox > button", null], ["check.html", ":is(.checkbox, .radio, .switch)", null], ["table.html", ".table :is(button, .checkbox)", null], ["datatable.html", ".datatable > .scroll", null], ["tabs.html", ".tabs :is(a, label)", 6], ["segmented.html", ".join > .btn", 11], ["pagination.html", ".btn:not(span, [aria-disabled])", 5], ["steps.html", ".steps a", 2], ["tree.html", ".tree :is(a, summary)", 14]]) {
    if (count) test(`${p}: every colour and style keeps contrast on hover`, async ({ page }) => {
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
      await page.addStyleTag({ content: "* { transition: none !important }" });
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate((cls) => document.activeElement.closest("main " + cls), cls)) break;
      }
      // closest, not matches: a toggle label's hidden input holds focus and the label draws the ring
      const outline = await page.evaluate((cls) => {
        const el = document.activeElement.closest("main " + cls);
        const s = getComputedStyle(el ?? document.activeElement);
        const rgb = (c) => { const x = document.createElement("canvas").getContext("2d"); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3); };
        // a bordered control turns every side of its border to the ring colour (the ring is it at half opacity, so compare rgb)
        const ring = rgb(s.outlineColor);
        const border = parseFloat(s.borderTopWidth) ? ["Top", "Right", "Bottom", "Left"].filter((side) => rgb(s[`border${side}Color`]).some((v, i) => Math.abs(v - ring[i]) > 3)) : [];
        return { matches: !!el, style: s.outlineStyle, width: parseFloat(s.outlineWidth), border };
      }, cls);
      expect(outline.matches).toBe(true);
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
      expect(outline.border, "border sides not in the ring colour").toEqual([]);
    });

    // the invalid ring is a colour change only, so check it is also 2px and red
    if (cls === ".input") test(`${p}: an invalid input focuses with a red ring`, async ({ page }) => {
      await page.goto("/" + p);
      const email = page.locator("#email");
      await email.focus();
      // the ring is the border colour at half opacity: paint both and compare the rgb, not the alpha
      const ring = await email.evaluate((el) => {
        const rgb = (c) => { const x = document.createElement("canvas").getContext("2d"); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3); };
        const s = getComputedStyle(el);
        return { w: parseFloat(s.outlineWidth), c: rgb(s.outlineColor), b: rgb(s.borderTopColor) };
      });
      expect(ring.w).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < 3; i++) expect(Math.abs(ring.c[i] - ring.b[i])).toBeLessThanOrEqual(2);
      const { violations } = await axe(page).include("#email").analyze();
      expect(summary(violations)).toEqual([]);
    });

    if (cls === ".input") test(`${p}: a wrapper takes the ring when its control is focused, and every size matches the button`, async ({ page }) => {
      await page.goto("/" + p);
      await page.locator("#price").focus();
      const w = await page.locator("#price").evaluate((el) => parseFloat(getComputedStyle(el.parentElement).outlineWidth));
      expect(w).toBeGreaterThanOrEqual(2);
      const rows = await page.locator("main section:nth-of-type(6) > div > div").all();
      expect(rows.length).toBe(5);
      for (const row of rows) {
        const [a, b] = await row.evaluate((el) => [...el.children].map((c) => c.getBoundingClientRect().height));
        expect(a).toBe(b);
      }
    });

    // the select picker is closed at load, so axe never sees it: open it, check it, and check it opens below
    if (cls === ".input") test(`${p}: an open select picker passes axe and opens below the control`, async ({ page }) => {
      await page.goto("/" + p);
      const select = page.locator("#plan");
      await select.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await select.click();
      const r = await select.evaluate((el) => ({
        appearance: getComputedStyle(el).appearance,
        open: el.matches(":open"),
        below: el.querySelector("option").getBoundingClientRect().top - el.getBoundingClientRect().bottom,
      }));
      expect(r).toEqual({ appearance: "base-select", open: true, below: expect.any(Number) });
      expect(r.below).toBeGreaterThanOrEqual(0);
      const { violations } = await axe(page).include("#plan").analyze();
      expect(summary(violations)).toEqual([]);
    });

    // a link in a sentence is exempt from 2.5.8: the line height sets its size
    if (cls !== ".link") test(`${p}: every interactive element meets the 24px minimum target size`, async ({ page }) => {
      await page.goto("/" + p);
      const small = [];
      for (const b of await page.locator(`main :is(a, button, input, select, textarea, label):is(${cls})`).all()) {
        if (!(await b.isVisible())) continue; // e.g. inside a closed <details>
        const box = await b.boundingBox();
        if (box.width < 24 || box.height < 24) small.push(await b.textContent());
      }
      expect(small).toEqual([]);
    });
    }
  });
}

// forced colours repaint every background as Canvas, so a state drawn only as a fill vanishes; read the pixels back
test("forced colours: checked and filled states still differ from their opposites", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const at = async (loc, x, y = 0.5) => (await shot(loc))(x, y);
  await page.goto("/check.html");
  await page.addStyleTag({ content: "*, ::before { transition: none !important }" });
  const box = (name) => page.locator("main label", { hasText: new RegExp(`^\\s*${name}$`) }).first().locator("input");
  // beside the mark, which is HighlightText and can match Canvas; on the switch, where the thumb sits when off
  for (const [off, on, x, y] of [["Unchecked", "Checked", 0.2, 0.2], ["Team", "Free", 0.2, 0.2], ["Off", "On", 0.3, 0.5]]) {
    expect(same(await at(box(off), x, y), await at(box(on), x, y)), `${off} looks like ${on}`).toBe(false);
  }

  await page.goto("/segmented.html");
  const sort = page.locator("main [aria-label=Sort] > label");
  expect(same(await at(sort.nth(0), 0.1), await at(sort.nth(1), 0.1))).toBe(false);

  await page.goto("/progress.html");
  await page.addStyleTag({ content: "* { transition: none !important }" });
  const up = await shot(page.locator("#upload"));
  expect(same(up(0.2, 0.5), up(0.8, 0.5))).toBe(false); // bar differs from track

  await page.goto("/range.html");
  const r = page.locator("#volume"), w = (await r.boundingBox()).width;
  const range = await shot(r);
  expect(same(range((10 + 0.4 * (w - 20)) / w, 0.5), range(0.9, 0.5))).toBe(false); // thumb differs from track
});

// an invoice printed from a dark screen: light whatever the OS or the switcher says, and only main on the page
test("app/shell.html: print is light and shows only main", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/app/shell.html");
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; document.querySelector("main").insertAdjacentHTML("beforeend", '<div class="inverse" id="flip">x</div>'); });
  const bg = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
  const screen = await bg("body");
  await page.emulateMedia({ media: "print", colorScheme: "dark" });
  expect(await bg("body")).not.toBe(screen);
  expect(await bg("#flip")).toBe(await bg("body"));
  await expect(page.locator("aside")).toBeHidden();
  await expect(page.locator("header")).toBeHidden();
  await expect(page.locator("#toaster")).toBeHidden();
  await expect(page.locator("main")).toBeVisible();
});

test("app/shell.html: the scheme switcher pins the scheme, remembers it and goes back to the OS", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/app/shell.html");
  const html = page.locator("html");
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
  await expect(html).not.toHaveAttribute("data-theme");

  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await bg()).not.toBe(light);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

  // applied before paint: the head script has set it before the stylesheet loads
  await page.route("**/shell.css", async (route) => { await new Promise((r) => setTimeout(r, 300)); await route.continue(); });
  await page.goto("/app/shell.html", { waitUntil: "commit" });
  await page.waitForSelector("head link[rel=stylesheet]", { state: "attached" });
  expect(await page.evaluate(() => [document.documentElement.dataset.theme, document.styleSheets.length])).toEqual(["dark", 0]);
  await page.unroute("**/shell.css");
  await page.waitForLoadState();

  await page.getByRole("radio", { name: "System" }).click();
  await expect(html).not.toHaveAttribute("data-theme");
  expect(await bg()).toBe(light);
  await page.reload();
  await expect(html).not.toHaveAttribute("data-theme");
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
});

test("disabled links have no URL and loading buttons cannot activate", async ({ page }) => {
  await page.goto("/button.html");
  const disabledLink = page.locator('main a[aria-disabled="true"]');
  await expect(disabledLink).not.toHaveAttribute("href", /.+/);
  await expect(disabledLink).toHaveAttribute("role", "link");

  await page.goto("/loading.html");
  const loading = page.locator("main button.loading");
  await expect(loading).toHaveCount(5);
  for (const button of await loading.all()) {
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    const activations = await button.evaluate((el) => {
      let count = 0;
      el.addEventListener("click", () => count++);
      el.click();
      return count;
    });
    expect(activations).toBe(0);
  }
});
