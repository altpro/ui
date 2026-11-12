// ConfirmDialog.vue on confirm.html. In every browser: Esc and closedby are where they differ.
import { test, expect } from "./fixtures.js";

test("focus starts on Cancel, nothing closes it while busy, and it closes from code when done", async ({ page }) => {
  await page.goto("/confirm.html");
  const open = page.getByRole("button", { name: "Delete product" }).first();
  const dialog = page.getByRole("dialog", { name: "Delete Arc studio?" });
  const confirm = dialog.getByRole("button", { name: "Delete product" });

  await open.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("It goes from the shop at once. This can't be undone.");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

  await confirm.click();
  await expect(confirm).toHaveAttribute("aria-busy", "true");
  await expect(confirm).toHaveAttribute("aria-disabled", "true");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeDisabled();
  // Esc twice: the second fires no cancel event in Chromium, and closedby is missing from older Safari
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  // a second press while busy sends nothing more
  await confirm.dispatchEvent("click");

  await expect(dialog).toBeHidden({ timeout: 4000 });
  await expect(open).toBeFocused();
  await expect(page.locator("#confirm-delete [role=status]")).toHaveText("Arc studio deleted.");
});

test("a body field takes focus, Enter confirms, an error keeps it open, and closing forgets it", async ({ page }) => {
  await page.goto("/confirm.html");
  const open = page.getByRole("button", { name: "Delete account" }).first();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  const password = dialog.getByLabel("Password");

  await open.click();
  await expect(password).toBeFocused();
  await password.fill("wrong");
  await password.press("Enter");
  await expect(dialog.locator(".error:visible")).toHaveText("The password is incorrect.");
  await expect(password).toBeFocused();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await expect(password).toHaveValue("");
  await expect(dialog.locator(".error:visible")).toHaveCount(0);

  await password.fill("password");
  await dialog.getByRole("button", { name: "Delete account" }).click();
  await expect(dialog).toBeHidden();
});

test("the description slot takes markup, and Esc closes it when not busy", async ({ page }) => {
  await page.goto("/confirm.html");
  const open = page.getByRole("button", { name: "Send invoice" }).first();
  const dialog = page.getByRole("dialog", { name: "Send invoice INV-2026-0091?" });

  await open.click();
  await expect(dialog).toHaveAccessibleDescription("It goes to accounts@example.com with the PDF attached.");
  await expect(dialog.locator("strong")).toHaveText("accounts@example.com");
  await expect(dialog.getByRole("button", { name: "Send invoice" })).toHaveClass(/\bprimary\b/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test("with form, the confirm button submits the body's own form, once while busy", async ({ page }) => {
  await page.goto("/confirm.html");
  const open = page.getByRole("button", { name: "Archive order" }).first();
  const dialog = page.getByRole("dialog", { name: "Archive order 1042?" });
  const confirm = dialog.getByRole("button", { name: "Archive order" });
  const status = page.locator("#confirm-form [role=status]");

  await open.click();
  await expect(confirm).toHaveAttribute("form", "archive-order-form");
  await confirm.click();
  await expect(confirm).toHaveAttribute("aria-busy", "true");
  // a press while busy, as Enter or Space on the focused button would send, submits nothing
  await confirm.dispatchEvent("click");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeHidden({ timeout: 4000 });
  await expect(status).toHaveText("Sent 1 request.");
});
