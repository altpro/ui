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
  expect(await first.evaluate((p) => p.isConnected)).toBe(false);
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
