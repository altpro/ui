// The recipe pages in demo/app (references/recipes.md): Pages/Products/*.vue against the stand-in server in demo/app/server.js.
// Each test gets a new context, so the stand-in's sessionStorage database starts from its seed.
import { test, expect } from "@playwright/test";

const toast = (page) => page.locator("#toaster .alert");

test("edit page: server errors appear and clear, a save becomes the new defaults, and Discard goes back to them", async ({ page }) => {
  await page.goto("/app/recipe-product.html?id=2");
  const name = page.getByLabel("Name", { exact: true }), price = page.getByLabel("Price", { exact: true });
  const status = page.locator("form [role=status]"), discard = page.getByRole("button", { name: "Discard" });
  await expect(name).toHaveValue("Arc studio");
  await expect(discard).toBeDisabled();

  await name.fill("");
  await price.fill("-5");
  await expect(status).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("The name field is required.")).toBeVisible();
  await expect(page.getByText("The price field must be at least 0.")).toBeVisible();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(price).toHaveAttribute("aria-invalid", "true");

  await name.fill("Arc studio pro");
  await price.fill("399");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(toast(page)).toHaveText("Product saved.");
  await expect(page.locator("form .error:visible")).toHaveCount(0);
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc studio pro");
  await expect(status).toHaveText("Saved.");
  await expect(discard).toBeDisabled();

  // Discard puts back the saved values, not the ones the page loaded with, and clears errors
  await name.fill("");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("The name field is required.")).toBeVisible();
  await discard.click();
  await expect(name).toHaveValue("Arc studio pro");
  await expect(price).toHaveValue("399");
  await expect(page.getByText("The name field is required.")).toBeHidden();
  await expect(discard).toBeDisabled();

  // the list reads the same database
  await page.getByRole("navigation", { name: "Breadcrumb" }).last().getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await expect(page.locator("tbody")).toContainText("Arc studio pro");
});

test("list page: the server searches, filters and pages, and a bulk action runs on ids or on everything matching", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const dt = page.locator(".datatable"), rows = dt.locator("tbody tr"), summary = dt.getByRole("status");
  await expect(summary).toHaveText("Showing 1–10 of 14");
  await dt.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(summary).toHaveText("Showing 11–14 of 14");

  await dt.getByRole("searchbox").fill("loop");
  await expect(rows).toHaveCount(2);
  await expect(page).toHaveURL(/search=loop/);
  await expect(summary).toContainText("Showing 1–2 of 2");
  await dt.getByRole("searchbox").fill("");
  await expect(summary).toHaveText("Showing 1–10 of 14");

  // ids: a status filter, then one ticked row
  await dt.getByRole("combobox", { name: "Status", exact: true }).selectOption("Draft");
  await expect(page).toHaveURL(/status=Draft/);
  await expect(rows).toHaveCount(3);
  await rows.first().getByRole("checkbox").check();
  await dt.getByRole("button", { name: "Archive" }).click();
  await expect(toast(page)).toHaveText("1 product archived.");
  await expect(rows).toHaveCount(2);
  await expect(dt.locator(".bulk")).toBeHidden();

  // matching: the page, then the rest of the query, which the server runs again
  await dt.getByRole("combobox", { name: "Status", exact: true }).selectOption("Active");
  await expect(summary).toHaveText("Showing 1–10 of 10, filtered from 14");
  await dt.getByRole("combobox", { name: "Status", exact: true }).selectOption("");
  await expect(summary).toContainText("of 14");
  await dt.getByRole("checkbox", { name: /Select every .* row on this page/ }).check();
  await dt.getByRole("button", { name: "Select all 14 matching" }).click();
  await dt.getByRole("button", { name: "Archive" }).click();
  await expect(toast(page).last()).toHaveText("14 products archived.");
  await expect(dt.locator("tbody .badge")).toHaveText(Array(10).fill("Archived"));

  // a row's Edit link is an Inertia visit to the edit page
  await dt.getByRole("link", { name: "Edit Arc headphones" }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc headphones");
});

test("tags and photos: the combobox searches and creates on the server, and each photo uploads with progress and its own errors", async ({ page }) => {
  await page.goto("/app/recipe-media.html?id=3");
  const box = page.locator(".combobox"), trigger = box.getByRole("combobox", { name: "Tags", exact: true }), search = box.getByRole("combobox", { name: "Search Tags" });
  await expect(trigger).toHaveText("Wireless");
  await trigger.click();
  // the search box takes focus on toggle, after the click: typing sooner can land on the trigger (WebKit)
  await expect(search).toBeFocused();
  await page.keyboard.type("vin");
  await expect(box.getByRole("option")).toHaveText(["Add “vin”"]);
  await search.fill("Vinyl");
  await expect(box.getByRole("option")).toHaveText(["Add “Vinyl”"]);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(trigger).toContainText("Vinyl");
  await page.getByRole("button", { name: "Save tags" }).click();
  await expect(toast(page)).toHaveText("Tags saved.");
  await page.reload();
  await expect(trigger).toContainText("Wireless");
  await expect(trigger).toContainText("Vinyl");
  // the new tag is a tag now: a search finds it
  await trigger.click();
  await expect(search).toBeFocused();
  await page.keyboard.type("vinyl");
  await expect(box.getByRole("option")).toHaveText(["Vinyl"]);
  await page.keyboard.press("Escape");

  // a 1x1 PNG uploads; a 6 MB one comes back with a 422 that lands on its own row
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  await page.locator("#photos").setInputFiles([
    { name: "front.png", mimeType: "image/png", buffer: png },
    { name: "poster.png", mimeType: "image/png", buffer: Buffer.alloc(6 * 1024 * 1024) },
  ]);
  const files = page.locator(".dropzone li");
  await expect(page.getByRole("progressbar", { name: "Uploading front.png" })).toBeVisible();
  await expect(page.getByText(/^Uploading 2 of 2…$/)).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(files.filter({ hasText: "poster.png" })).toContainText("The photo field must not be greater than 5120 kilobytes.");
  await expect(files.filter({ hasText: "front.png" }).locator(".error:visible")).toHaveCount(0);
  // removing the failed file leaves the uploaded one and its clean state
  await page.getByRole("button", { name: "Remove poster.png" }).click();
  await expect(files).toHaveCount(1);
  await expect(page.getByText("The photo field must not be greater than 5120 kilobytes.")).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).photos.map((p) => p.name))).toEqual(["front.png"]);
  await page.getByRole("button", { name: "Remove front.png" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).photos.length)).toBe(0);
});
