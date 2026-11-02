// CopyButton.vue on copy.html. Chromium only: it is the engine that lets a test grant clipboard permissions.
import { test, expect } from "@playwright/test";

const bubble = (b) => b.evaluate((el) => { const s = getComputedStyle(el, "::after"); return `${s.content} ${s.visibility}`; });

test("copies the value, shows Copied in the tooltip, announces it, then goes back", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/copy.html");
  const button = page.locator("#copy-join").getByRole("button", { name: "Copy tracking code" });
  const live = page.locator("body > [aria-live=polite]");
  await expect(live).toHaveCount(5);

  await button.click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("JD014600006281234567");
  await expect.poll(() => bubble(button)).toBe('"Copied" visible');
  await expect(live.filter({ hasText: "Copied" })).toHaveCount(1);
  await expect(button).toHaveAccessibleName("Copy tracking code");

  // a second copy puts a new node in the region, so it is announced again
  const first = await live.locator("p").elementHandle();
  await button.click();
  await expect.poll(() => first.evaluate((p) => p.isConnected)).toBe(false);
  await expect(live.filter({ hasText: "Copied" })).toHaveCount(1);

  await expect(button).toHaveAttribute("data-tooltip", "Copy tracking code", { timeout: 3000 });
  await expect(live.locator("p")).toHaveCount(0);
});

test("a refused write says Copy failed", async ({ page }) => {
  await page.addInitScript(() => (navigator.clipboard.writeText = () => Promise.reject(new DOMException("denied", "NotAllowedError"))));
  await page.goto("/copy.html");
  const button = page.locator("#copy-inline").getByRole("button", { name: "Copy order number" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => bubble(button)).toBe('"Copy failed" visible');
  await expect(page.locator("body > [aria-live=polite]", { hasText: "Copy failed" })).toHaveCount(1);
});

// with no data-tooltip there is no bubble, and ::after reads content none
const showing = async (b) => (await bubble(b)).endsWith("visible") && !(await bubble(b)).startsWith("none");

// WCAG 1.4.13: content shown on hover or focus can be dismissed without moving either
test("Escape hides the tooltip, uses up the key only then, and the tooltip comes back once pointer and focus have left", async ({ page }) => {
  await page.goto("/copy.html");
  // the last Escape's defaultPrevented, read where a dialog would see it
  await page.evaluate(() => document.addEventListener("keydown", (e) => (window.escaped = e.key === "Escape" && e.defaultPrevented)));
  const button = page.locator("#copy-inline").getByRole("button", { name: "Copy order number" });
  const other = page.locator("#copy-join").getByRole("button", { name: "Copy tracking code" });

  // keyboard: Escape on the focused button
  await button.focus();
  await expect.poll(() => bubble(button)).toBe('"Copy order number" visible');
  await page.keyboard.press("Escape");
  await expect.poll(() => showing(button)).toBe(false);
  expect(await page.evaluate(() => window.escaped)).toBe(true);
  await expect(button).toHaveAccessibleName("Copy order number");
  // already hidden: the next Escape is the page's, to close a dialog
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.escaped)).toBe(false);
  // a copy shows its result again
  await page.keyboard.press("Enter");
  await expect.poll(() => showing(button)).toBe(true);
  await page.keyboard.press("Escape");
  await other.focus();
  await button.focus();
  await expect.poll(() => showing(button)).toBe(true);

  // pointer: Escape reaches the document while focus is elsewhere
  await other.focus();
  await button.hover();
  await expect.poll(() => showing(button)).toBe(true);
  await page.keyboard.press("Escape");
  await expect.poll(() => showing(button)).toBe(false);
  await page.mouse.move(0, 0);
  await button.hover();
  await expect.poll(() => showing(button)).toBe(true);

  // nothing showing: Escape is left alone
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.escaped)).toBe(false);
});
