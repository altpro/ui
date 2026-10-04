// Repeater.vue on the order edit page: add, remove, move, where focus lands, and errors following their line.
// Runs in all three browsers, since moving a focused node loses focus differently in each.
import { test, expect } from "@playwright/test";

const lines = (page) => page.locator(".repeater > ol > li");
const line = (page, n) => lines(page).nth(n - 1);
const button = (page, name) => page.getByRole("button", { name, exact: true });
const live = (page) => page.locator(".repeater [aria-live]");
test.beforeEach(async ({ page }) => { await page.goto("/app/order.html"); });

test("add appends a line and focuses its first field", async ({ page }) => {
  await button(page, "Add line").click();
  await expect(lines(page)).toHaveCount(4);
  await expect(line(page, 4).getByLabel("Product")).toBeFocused();
  await expect(line(page, 4).getByLabel("Quantity")).toHaveValue("1");
  await expect(live(page)).toHaveText("Line 4 added.");
});

test("move keeps focus on the moved line; the first up and last down are disabled", async ({ page }) => {
  await expect(button(page, "Move line 1 up")).toBeDisabled();
  await expect(button(page, "Move line 3 down")).toBeDisabled();
  await button(page, "Move line 3 up").click();
  await expect(button(page, "Move line 2 up")).toBeFocused();
  await expect(line(page, 2).getByLabel("Product")).toHaveValue("2");
  await expect(live(page)).toHaveText("Line 3 moved up, now line 2.");
  await page.keyboard.press("Enter");
  // at the top its up button is disabled, so focus goes to its down button
  await expect(button(page, "Move line 1 down")).toBeFocused();
  await expect(line(page, 1).getByLabel("Product")).toHaveValue("2");
  await expect(line(page, 1).getByLabel("Quantity")).toHaveAttribute("name", "lines.0.qty");
});

test("remove focuses the next line's remove button, then the previous, then Add", async ({ page }) => {
  await button(page, "Remove line 2").click();
  await expect(lines(page)).toHaveCount(2);
  await expect(button(page, "Remove line 2")).toBeFocused();
  await expect(line(page, 2).getByLabel("Product")).toHaveValue("2");
  await expect(live(page)).toHaveText("Line 2 removed.");
  await page.keyboard.press("Enter");
  await expect(button(page, "Remove line 1")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(lines(page)).toHaveCount(0);
  await expect(button(page, "Add line")).toBeFocused();
  await button(page, "Save order").click();
  await expect(page.locator(".repeater > .error")).toHaveText("Add at least one line.");
});

test("server errors follow their line, go when it is removed, and nothing moves while saving", async ({ page }) => {
  await button(page, "Save order").click();
  for (const name of ["Add line", "Move line 2 up", "Remove line 1"]) await expect(button(page, name)).toBeDisabled();
  await expect(line(page, 2).getByText("Only 2 in stock.")).toBeVisible();
  await expect(line(page, 2).getByLabel("Quantity")).toHaveAttribute("aria-invalid", "true");

  await button(page, "Move line 2 up").click();
  await expect(line(page, 1).getByText("Only 2 in stock.")).toBeVisible();
  await expect(line(page, 1).getByLabel("Quantity")).toHaveAttribute("aria-invalid", "true");
  await expect(line(page, 2).getByLabel("Quantity")).not.toHaveAttribute("aria-invalid");

  await button(page, "Add line").click();
  await button(page, "Move line 4 up").click();
  await expect(line(page, 1).getByText("Only 2 in stock.")).toBeVisible();

  await button(page, "Remove line 1").click();
  await expect(page.getByText("Only 2 in stock.")).toHaveCount(0);
  await button(page, "Save order").click();
  await expect(line(page, 2).getByText("Choose a product.")).toBeVisible();
  await line(page, 2).getByLabel("Product").selectOption("4");
  await button(page, "Save order").click();
  await expect(page.getByRole("status")).toHaveText("Order saved.");
  await expect(page.locator(".repeater .error")).toHaveCount(0);
});

test("the save bar offers Discard only while there are unsaved changes, and Discard puts the lines back", async ({ page }) => {
  await expect(button(page, "Discard")).toBeDisabled();
  await line(page, 1).getByLabel("Quantity").fill("3");
  await expect(page.getByRole("status")).toHaveText("Unsaved changes");
  await button(page, "Remove line 2").click();
  await button(page, "Discard").click();
  await expect(lines(page)).toHaveCount(3);
  await expect(line(page, 1).getByLabel("Quantity")).toHaveValue("2");
  await expect(button(page, "Discard")).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("");
});
