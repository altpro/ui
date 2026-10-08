// The recipe pages in demo/app (references/recipes.md, validation-failure.md, unsaved-changes.md, destructive-action.md):
// pages/ in layouts/AppLayout.vue against the stand-in server in demo/app/server.js.
// Each test gets a new context, so the stand-in's sessionStorage database starts from its seed.
import { test, expect } from "@playwright/test";

const toast = (page) => page.locator("#toaster .alert");

test("edit page: a failed save focuses the error summary, a save becomes the new defaults, and Discard goes back to them", async ({ page }) => {
  await page.goto("/app/recipe-product.html?id=2");
  const name = page.getByLabel("Name", { exact: true }), price = page.getByLabel("Price", { exact: true });
  const status = page.locator("form [role=status]"), discard = page.getByRole("button", { name: "Discard" });
  const summary = page.locator("form").getByRole("alert"), fieldErrors = page.locator("form .field .error:visible");
  await expect(name).toHaveValue("Arc studio");
  await expect(discard).toBeDisabled();
  // one shell: AppLayout draws the only breadcrumb, from the page's prop; on the page load the skip link is the first Tab
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await name.fill("");
  await price.fill("-5");
  await expect(status).toHaveText("Unsaved changes");
  // novalidate: an emptied required field stays its normal colour until the server sends a message for it.
  // Name has just lost focus, so end its border's transition back from the ring colour before reading it.
  await page.addStyleTag({ content: ".input { transition: none !important }" });
  const border = (input) => input.evaluate((el) => getComputedStyle(el.closest(".input")).borderTopColor);
  expect(await border(name)).toBe(await border(page.getByLabel("SKU", { exact: true })));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  // the summary lists every error and takes focus; Tab goes on to the first field
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading")).toHaveText("The product was not saved");
  await expect(summary.getByRole("listitem")).toHaveText(["The name field is required.", "The price field must be at least 0."]);
  await expect(fieldErrors).toHaveText(["The name field is required.", "The price field must be at least 0."]);
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(price).toHaveAttribute("aria-invalid", "true");
  await page.keyboard.press("Tab");
  await expect(name).toBeFocused();

  await name.fill("Arc studio pro");
  await price.fill("399");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(toast(page)).toHaveText("Product saved.");
  await expect(summary).toHaveCount(0);
  await expect(fieldErrors).toHaveCount(0);
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc studio pro");
  await expect(status).toHaveText("Saved.");
  await expect(discard).toBeDisabled();

  // Discard puts back the saved values, not the ones the page loaded with, and clears errors
  await name.fill("");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(summary).toBeFocused();
  await discard.click();
  await expect(name).toHaveValue("Arc studio pro");
  await expect(price).toHaveValue("399");
  await expect(summary).toHaveCount(0);
  await expect(fieldErrors).toHaveCount(0);
  await expect(discard).toBeDisabled();

  // the list reads the same database; a clean form lets the visit go without asking
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await expect(page.locator("tbody")).toContainText("Arc studio pro");
});

test("edit page: leaving with unsaved changes asks first, in the app and through the browser", async ({ page }) => {
  await page.goto("/app/recipe-product.html?id=2");
  const name = page.getByLabel("Name", { exact: true });
  const products = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" });
  // what the browser's own prompt hangs on: a beforeunload that is cancelled
  const unloadBlocked = () => page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    dispatchEvent(event);
    return event.defaultPrevented;
  });
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return asked.length === 1 ? dialog.dismiss() : dialog.accept();
  });

  expect(await unloadBlocked()).toBe(false);
  await name.fill("Arc studio mk2");
  expect(await unloadBlocked()).toBe(true);

  // an Inertia visit asks with confirm(): Cancel stays on the page with the edit
  await products.click();
  await expect.poll(() => asked).toEqual(["You have unsaved changes. Leave this page and lose them?"]);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(name).toHaveValue("Arc studio mk2");

  // a save is not leaving, and leaves nothing unsaved
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("form [role=status]")).toHaveText("Saved.");
  expect(await unloadBlocked()).toBe(false);
  expect(asked).toHaveLength(1);

  // dirty again, and OK leaves; the new page puts focus on its main
  await name.fill("Arc studio mk3");
  await page.getByRole("link", { name: "Tags and photos" }).click();
  await expect(page).toHaveURL(/recipe-media\.html\?id=2$/);
  expect(asked).toHaveLength(2);
  await expect(page.locator("#main")).toBeFocused();
  expect(await unloadBlocked()).toBe(false);
});

test("delete account: a wrong password keeps the dialog open with the error in it, closing forgets it, and the right one deletes", async ({ page }) => {
  await page.goto("/app/recipe-settings.html");
  const open = page.locator("section").getByRole("button", { name: "Delete account" });
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  const password = dialog.getByLabel("Password"), confirm = dialog.getByRole("button", { name: "Delete account" });
  const error = dialog.locator(".error:visible");

  await open.click();
  await expect(dialog).toBeVisible();
  await expect(password).toBeFocused();
  await confirm.click();
  await expect(error).toHaveText("The password field is required.");
  await password.fill("wrong");
  await confirm.click();
  await expect(confirm).toHaveAttribute("aria-busy", "true");
  await expect(confirm).toBeDisabled();
  await expect(error).toHaveText("The password is incorrect.");
  await expect(dialog).toBeVisible();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(password).toBeFocused();
  await expect(confirm).not.toHaveAttribute("aria-busy", "true");

  // Esc closes it, focus goes back to the button that opened it, and the password and its error go with it
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await expect(password).toHaveValue("");
  await expect(error).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();

  // the right password: Laravel logs the user out and redirects home, which is a full page load
  await open.click();
  await password.fill("password");
  await password.press("Enter");
  await expect(page).toHaveURL(/:\d+\/$/);
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
  // "matching" re-runs the query from Product::visibleTo(), so another team's product, never listed, is untouched
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).products.find((p) => p.team_id === 2).status)).toBe("Active");

  // a row's Edit link is an Inertia visit to the edit page
  await dt.getByRole("link", { name: "Edit Arc headphones" }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc headphones");
  // a visit to a new page puts focus on its main, not on <body> where the clicked link left it
  await expect(page.locator("#main")).toBeFocused();
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

test("user menu: the shared user's name opens a menu with their email, and Log out posts and leaves the app", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app/recipe-products.html");
  const sidebar = page.locator("aside");
  await sidebar.getByRole("button", { name: "Sam Taylor" }).click();
  const menu = page.locator("#user-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("sam@forma.test");
  await menu.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/(index\.html)?$/);
});
