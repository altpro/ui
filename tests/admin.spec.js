// The pieces an admin screen is built from, moved here from the altpro starter kit in 0.6: PageHeading, PageBreadcrumb,
// ListHeader and StatLink (heading.html, stat.html), LocalDate (local-date.html), UserAvatar and EmailAddress
// (avatar.html); a dialog's footer kept in view (dialog.html); and the two things a host brands, the primary colour and the font.
import { test, expect } from "./fixtures.js";

test("PageHeading: the breadcrumb is the first line above the h1, which can take focus, with badges beside and actions after", async ({ page }) => {
  await page.goto("/heading.html");
  const heading = page.locator("main .card").first();
  const crumbs = heading.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs.getByRole("link", { name: "DataTable" })).toHaveAttribute("href", "/datatable.html");
  await expect(crumbs.locator("[aria-current=page]")).toHaveText("Samantha Okafor-Lindqvist");
  const h1 = heading.getByRole("heading", { level: 1 });
  await expect(h1).toHaveText("Samantha Okafor-Lindqvist");
  await expect(h1).toHaveAttribute("tabindex", "-1");
  const above = await crumbs.evaluate((nav, h) => nav.getBoundingClientRect().bottom <= document.querySelector(h).getBoundingClientRect().top, "main .card h1");
  expect(above).toBe(true);
  // the avatar is decorative: the h1 names the person
  await expect(heading.locator(".avatar")).toHaveAttribute("aria-hidden", "true");
  await expect(heading.locator(".avatar")).toHaveText("SO");
  // a link in the breadcrumb is a visit; with no server here, the demo loads the page in full
  await crumbs.getByRole("link", { name: "DataTable" }).click();
  await expect(page).toHaveURL(/datatable\.html$/);
});

test("PageHeading: on a phone the actions take a row of their own under the title, and fill it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/heading.html");
  const heading = page.locator("main .card").first();
  const h1 = await heading.getByRole("heading", { level: 1 }).boundingBox();
  const button = await heading.getByRole("button", { name: "Send password reset" }).boundingBox();
  const card = await heading.evaluate((el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return { left: r.left + parseFloat(s.paddingLeft) + 1, right: r.right - parseFloat(s.paddingRight) - 1 }; });
  expect(button.y).toBeGreaterThan(h1.y + h1.height - 1);
  expect(button.x).toBeCloseTo(card.left, 0);
  expect(button.x + button.width).toBeCloseTo(card.right, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("ListHeader: the count says its base once a card narrows the list, Clear takes it off, and the current card toggles", async ({ page }) => {
  await page.goto("/heading.html");
  const header = page.locator(".datatable .header");
  const count = header.locator("p").first(), clear = header.getByRole("button", { name: "Clear" });
  const card = (name) => header.getByRole("navigation", { name: "Filter by status" }).getByRole("link", { name: new RegExp(`^${name}`) });
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Products");
  await expect(count).toHaveText("14 products");
  await expect(clear).toBeHidden();
  await expect(card("Active")).toContainText("9");
  await expect(card("Draft")).toContainText("3");
  await expect(card("Archived")).toContainText("2");
  // the status filter is the cards' (control: false): no select beside them says the same
  await expect(page.locator(".datatable .controls select, .datatable .controls .field")).toHaveCount(0);

  await card("Draft").click();
  await expect(page).toHaveURL(/heading_status=Draft/);
  await expect(count).toHaveText("3 of 14 products");
  await expect(card("Draft")).toHaveAttribute("aria-current", "true");
  await expect(card("Draft")).toHaveAccessibleName(/remove this filter$/);
  await expect(page.locator(".datatable tbody tr")).toHaveCount(3);

  // the current card takes its own filter off again
  await card("Draft").click();
  await expect(count).toHaveText("14 products");
  await expect(card("Draft")).not.toHaveAttribute("aria-current", "true");

  await card("Archived").click();
  await expect(count).toHaveText("2 of 14 products");
  await clear.click();
  await expect(count).toHaveText("14 products");
  await expect(page).not.toHaveURL(/status=/);
  await expect(clear).toBeHidden();
});

test("StatLink: a link with its count formatted, and the current card marked for every reader", async ({ page }) => {
  await page.goto("/stat.html");
  const nav = page.getByRole("navigation", { name: "Filter by status" });
  await expect(nav.getByRole("link", { name: /^Active/ })).toContainText("1,204");
  await expect(nav.getByRole("link", { name: /^Active/ })).toHaveAttribute("href", "#active");
  const draft = nav.getByRole("link", { name: /^Draft/ });
  await expect(draft).toHaveAttribute("aria-current", "true");
  await expect(draft).toHaveAccessibleName("Draft 3 , remove this filter");
  // the current card's fill is the secondary token, not the card's
  const fills = await nav.evaluate((el) => [...el.children].map((a) => getComputedStyle(a).backgroundColor));
  expect(fills[1]).not.toBe(fills[0]);
  await draft.click();
  await expect(draft).not.toHaveAttribute("aria-current", "true");
});

test("LocalDate: Today, Yesterday, then the day, with the year when it is not this one, and a time where asked", async ({ page }) => {
  await page.goto("/local-date.html");
  const dd = page.locator("#local-date dd time");
  const now = new Date();
  const lastWeek = new Date(Date.now() - 6 * 86400000);
  const day = (d) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
  await expect(dd.nth(0)).toHaveText("Today");
  await expect(dd.nth(1)).toHaveText("Yesterday");
  await expect(dd.nth(2)).toHaveText(day(new Date(Date.now() - 4 * 86400000)));
  await expect(dd.nth(3)).toHaveText(`9 Mar ${now.getFullYear() - 1}`);
  await expect(dd.nth(4)).toHaveText("Today");
  await expect(dd.nth(5)).toHaveText(/^Today, \d\d:\d\d$/);
  await expect(dd.nth(6)).toHaveText(new RegExp(`^${day(lastWeek)}, \\d\\d:\\d\\d$`));
  // a machine-readable value for every reader, and words in a sentence
  await expect(dd.nth(0)).toHaveAttribute("datetime", /^\d{4}-\d\d-\d\dT/);
  await expect(page.locator("#local-date > p").first()).toHaveText(/^Last login today, \d\d:\d\d\.$/);
  await expect(page.locator("#local-date > p").nth(1)).toHaveText("Last login never.");
});

test("LocalDate: the words wait for the reader's clock, and change at their midnight", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T23:59:00") });
  await page.goto("/local-date.html");
  const first = page.locator("#local-date dd time").first();
  await expect(first).toHaveText("Today");
  await page.clock.runFor(2 * 60 * 1000);
  await expect(first).toHaveText("Yesterday");
});

test("UserAvatar and EmailAddress: one hue per name, initials or a photo, and an address that breaks only at the @", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/avatar.html");
  const people = page.locator("#user-avatar li");
  await expect(people.nth(0).locator(".avatar")).toHaveText("ST");
  await expect(people.nth(3).locator(".avatar")).toHaveText("C");
  await expect(people.nth(1).locator("img.avatar")).toHaveAttribute("alt", "");
  // the same name gets the same hue, wherever it is drawn
  const hue = (i) => people.nth(i).locator(".avatar").evaluate((el) => [...el.classList].find((c) => !["avatar", "shrink-0"].includes(c)));
  const first = await hue(0);
  await page.reload();
  expect(await hue(0)).toBe(first);
  // the long address wraps before its @, and the domain stays on one line
  const email = people.nth(2).locator("p.text-sm > span");
  const lines = await email.evaluate((el) => {
    const domain = el.lastElementChild;
    return { domain: domain.textContent, domainLines: domain.getClientRects().length, rects: el.getClientRects().length };
  });
  expect(lines.domain).toBe("@accounts.forma-industries.test");
  expect(lines.domainLines).toBe(1);
  expect(lines.rects).toBeGreaterThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("dialog: a footer that is the last child stays in view while a tall dialog scrolls, and nothing moves at rest", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto("/dialog.html");
  await page.getByRole("button", { name: "Read the terms" }).click();
  const dialog = page.getByRole("dialog", { name: "Terms of service" });
  await expect(dialog).toHaveCSS("opacity", "1");
  const accept = dialog.getByRole("button", { name: "Accept" });
  const inView = () => accept.evaluate((el) => {
    const b = el.getBoundingClientRect(), d = el.closest("dialog").getBoundingClientRect();
    return b.top >= d.top && b.bottom <= d.bottom;
  });
  expect(await dialog.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await inView()).toBe(true);
  await dialog.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
  expect(await inView()).toBe(true);
  // the footer covers what scrolls under it, with the card's own background
  expect(await dialog.locator("footer").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor));
  await page.keyboard.press("Escape");

  // a short dialog is laid out as a card with the same content: the footer's padding replaces the gap above it and
  // the dialog's own below, divided or not
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const divided of ["", " divided"]) {
    const [card, dialog] = await page.evaluate(async (divided) => {
      const html = "<header><h3>T</h3></header><p>Body</p><footer><button class=btn>OK</button></footer>";
      const card = Object.assign(document.createElement("div"), { className: `card${divided} w-80`, innerHTML: html });
      const dialog = Object.assign(document.createElement("dialog"), { className: `dialog${divided} w-80`, innerHTML: html });
      document.querySelector("main").append(card, dialog);
      dialog.showModal();
      // at rest: it scales in as it opens
      await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
      const layout = (el) => {
        const r = el.getBoundingClientRect(), p = el.querySelector("p").getBoundingClientRect(), b = el.querySelector("button").getBoundingClientRect();
        return { height: r.height, gap: b.top - p.bottom, bottom: r.bottom - b.bottom };
      };
      const out = [layout(card), layout(dialog)];
      card.remove();
      dialog.remove();
      return out;
    }, divided);
    expect(dialog).toEqual(card);
  }
});

test("theme: a host's primary colour and font reach the components, the focus ring with the primary", async ({ page }) => {
  await page.goto("/heading.html");
  await page.addStyleTag({ content: ':root { --color-primary: rgb(0, 81, 154); --color-primary-foreground: rgb(255, 255, 255); --font-sans: "Courier New", monospace; }' });
  const add = page.getByRole("link", { name: "Add product" });
  await expect(add).toHaveCSS("background-color", "rgb(0, 81, 154)");
  await expect(add).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("main h1").first()).toHaveCSS("font-family", /Courier New/);
  await add.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  // rgb(0, 81, 154) at half opacity
  expect(await add.evaluate((el) => getComputedStyle(el).outlineColor)).toMatch(/^oklab\(0\.436\d* -0\.038\d* -0\.131\d* \/ 0\.5\)$/);
});
