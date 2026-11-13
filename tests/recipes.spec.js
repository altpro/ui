// The recipe pages in demo/app (references/recipes.md, validation-failure.md, unsaved-changes.md, destructive-action.md):
// pages/ in layouts/AppLayout.vue against the stand-in server in demo/app/server.js.
// Each test gets a new context, so the stand-in's sessionStorage database starts from its seed.
import { test, expect } from "./fixtures.js";

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
  // Name has just lost focus, so poll until its border's transition back from the ring colour ends.
  const border = (input) => input.evaluate((el) => getComputedStyle(el.closest(".input")).borderTopColor);
  await expect.poll(() => border(name)).toBe(await border(page.getByLabel("SKU", { exact: true })));
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

  // money is a text field, so the server refuses what a number field would pass as 10
  await price.fill("1e1");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(summary.getByRole("listitem")).toHaveText(["The name field is required.", "The price field must have 0-2 decimal places."]);

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

  // Save on a clean form sends nothing and says so; the next change takes the message away
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status).toHaveText("No changes to save.");
  await name.fill("Arc studio pro!");
  await expect(status).toHaveText("Unsaved changes");
  await discard.click();
  await expect(status).toHaveText("");

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
  await expect.poll(() => asked).toEqual(["Leave this page? Your changes won't be saved."]);
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

test("edit page: Back and Forward keep an unsaved draft, still unsaved, and a reload starts from the server", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  await name.fill("Arc studio draft");
  await expect(status).toHaveText("Unsaved changes");

  // history brings the page back with no visit, so nothing can ask; the draft comes back with it instead
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(name).toHaveValue("Arc studio draft");
  await expect(status).toHaveText("Unsaved changes");
  // still unsaved: Discard goes back to the saved name, and the draft can come back again
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Arc studio");
  await name.fill("Arc studio mk2");

  // a reload is a fresh start, as the browser's own prompt said
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");

  // the draft saves, and once saved there is nothing to bring back
  await name.fill("Arc studio mk3");
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(name).toHaveValue("Arc studio mk3");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status).toHaveText("Saved.");
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(name).toHaveValue("Arc studio mk3");
  await expect(status).toHaveText("");
});

test("edit page: the draft Back brings is the latest, never one the reader discarded, left or failed to save", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  const backAndForth = async () => {
    await page.goBack();
    await expect(page).toHaveURL(/recipe-products\.html$/);
    await page.goForward();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc studio");
  };

  // a second change straight after the first, inside the time history writes are spaced by
  await name.fill("A");
  await name.fill("AB");
  await backAndForth();
  await expect(name).toHaveValue("AB");
  // a Discard straight after a change
  await name.fill("old draft");
  await page.getByRole("button", { name: "Discard" }).click();
  await backAndForth();
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");

  // a failed save keeps the draft
  await name.fill("");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toBeFocused();
  await backAndForth();
  await expect(name).toHaveValue("");
  await expect(status).toHaveText("Unsaved changes");

  // a submit or a leave another listener cancels (a second form's question answered Cancel) forgets nothing
  page.on("dialog", (dialog) => dialog.accept());
  const cancelVisits = (on) => page.evaluate((on) => {
    window.cancelVisits ??= (event) => event.preventDefault();
    document[on ? "addEventListener" : "removeEventListener"]("inertia:before", window.cancelVisits);
  }, on);
  await name.fill("kept");
  await cancelVisits(true);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await cancelVisits(false);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await backAndForth();
  await expect(name).toHaveValue("kept");
  await expect(status).toHaveText("Unsaved changes");

  // OK to "Your changes won't be saved" means they aren't, on Back either
  await name.fill("left behind");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goBack();
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");
});

// the stand-in server rewritten as it is served, for a slower answer or a save that goes elsewhere
const patchServer = (page, from, to) => page.route("**/app/server.js*", async (route) => {
  const response = await route.fetch();
  const body = (await response.text()).replace(from, to);
  expect(body).toContain(to);
  await route.fulfill({ response, body });
});

test("edit page: Back while a save is under way leaves the page Back went to as it was", async ({ page }) => {
  await patchServer(page, "} else await wait(200, config.signal);", "} else await wait(1500, config.signal);");
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await page.getByLabel("Name", { exact: true }).fill("Arc studio mk2");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(400);
  // Back cancels the save, whose end must not write the edit page into the list's history entry
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await expect(page.locator(".datatable")).toBeVisible();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [history.state.page.component, location.pathname])).toEqual(["products/Index", "/app/recipe-products.html"]);
  // and the save Back cut short was never made, so its draft is still there
  await page.goForward();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Arc studio mk2");
  await expect(page.locator("form [role=status]")).toHaveText("Unsaved changes");
});

test("edit page: text typed while a save is under way stays unsaved", async ({ page }) => {
  await patchServer(page, "} else await wait(200, config.signal);", "} else await wait(1000, config.signal);");
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  await name.fill("Arc studio mk2");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await name.fill("Arc studio mk3");
  await expect(page.getByRole("button", { name: "Save", exact: true })).not.toHaveClass(/loading/);
  await expect(status).toHaveText("Unsaved changes");
  // the draft Back and Forward bring differs from what was saved, not from what was there before
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(name).toHaveValue("Arc studio mk3");
  await expect(status).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Arc studio mk2");
});

// Inertia's router, as the page loaded it
const router = (page) => page.evaluate(async () => {
  const url = performance.getEntriesByType("resource").map((e) => e.name).find((n) => n.includes("@inertiajs_vue3"));
  window.inertia = await import(url);
});

test("edit page: one draft serves the entries a list beside the form makes, and a save leaves none of them one", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await router(page);
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  // what a list on the page sends: a sort pushes an entry, a search replaces it, both keeping the page mounted
  const visit = (query, replace) => page.evaluate(([query, replace]) =>
    window.inertia.router.get(`${location.pathname}${location.search}&${query}`, {}, { preserveState: true, replace, only: ["product"] }), [query, replace]);

  await name.fill("before the sort");
  await visit("sort=price", false);
  await expect(page).toHaveURL(/sort=price$/);
  await name.fill("after the sort");
  await visit("q=arc", true);
  await expect(page).toHaveURL(/sort=price&q=arc$/);
  await name.fill("after the search");
  // Back to before the sort keeps the latest edit, and so does Forward
  await page.goBack();
  await expect(page).toHaveURL(/id=2$/);
  await expect(name).toHaveValue("after the search");
  await expect(status).toHaveText("Unsaved changes");
  await page.goForward();
  await expect(page).toHaveURL(/q=arc$/);
  await expect(name).toHaveValue("after the search");

  // a save leaves no entry a draft to bring back
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status).toHaveText("Saved.");
  await page.goBack();
  await expect(page).toHaveURL(/id=2$/);
  // the entry's own props, as Inertia kept them, and no draft over them
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");

  // nor after a reload, which starts a new document that has not seen the save
  await page.goForward();
  await expect(page).toHaveURL(/q=arc$/);
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await page.goBack();
  await expect(page).toHaveURL(/id=2$/);
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");

  // a reload the reader agreed to starts afresh, and the entries before it don't bring back what they agreed to lose
  await name.fill("typed before the sort");
  await router(page);
  await visit("sort=name", false);
  await expect(page).toHaveURL(/sort=name$/);
  await name.fill("typed after the sort");
  await page.reload();
  // the record as the server has it, saved above
  await expect(name).toHaveValue("after the search");
  await page.goBack();
  await expect(page).toHaveURL(/id=2$/);
  await expect(name).toHaveValue("Arc studio");
  await expect(status).toHaveText("");
});

test("edit page: a reload of another page keeps a draft the reader never agreed to lose", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  page.on("dialog", (dialog) => dialog.accept());
  await name.fill("kept through it all");
  // out of the app, which notes the page, and back to the draft
  await page.goto("/button.html");
  await page.goBack();
  await expect(name).toHaveValue("kept through it all");
  // back to the list, a reload there, and forward to the form
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.reload();
  await page.goForward();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(name).toHaveValue("kept through it all");
  await expect(status).toHaveText("Unsaved changes");
});

test("edit page: leaving the app straight after typing keeps the last of it for Back", async ({ page }) => {
  await page.goto("/app/recipe-product.html?id=2");
  const name = page.getByLabel("Name", { exact: true });
  page.on("dialog", (dialog) => dialog.accept());
  await name.fill("A");
  await name.fill("AB");
  // a full page load: the document goes, and the draft with it unless history has it
  await page.goto("/button.html");
  await page.goBack();
  await expect(name).toHaveValue("AB");
  await expect(page.locator("form [role=status]")).toHaveText("Unsaved changes");
});

test("edit page: a save that lands on another record's page keeps each record's draft to itself", async ({ page }) => {
  // the save redirects to product 3's edit page, the same component at another URL, as create to edit does
  await patchServer(page, 'return back({ flash: { toast: { type: "success", message: "Product saved." } } });', "return edit(3);");
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Arc studio", exact: true }).click();
  const name = page.getByLabel("Name", { exact: true }), status = page.locator("form [role=status]");
  await name.fill("Arc studio mk2");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(name).toHaveValue("Arc studio mk2");
  await expect(page).not.toHaveURL(/recipe-product\.html\?id=2$/);
  // the record the save landed on, edited
  await name.fill("draft for the other record");
  await page.goBack();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(status).toHaveText("");
  await expect(name).not.toHaveValue("draft for the other record");
  await page.goForward();
  await expect(name).toHaveValue("draft for the other record");
  await expect(status).toHaveText("Unsaved changes");
});

// an open modal makes the toaster inert, so its dismiss cross, and any screen reader, could not reach a toast there
test("toast: with a modal open the message also shows in the dialog, until it closes, and the toast stays", async ({ page }) => {
  await page.goto("/app/recipe-settings.html");
  const say = (message, type) => page.evaluate(([message, type]) => import("/app/toast.js").then((m) => m.toast(message, type)), [message, type]);
  const toaster = page.locator("#toaster"), dialog = page.getByRole("dialog", { name: "Delete your account?" });

  await say("No modal", "info");
  await expect(toaster.getByText("No modal")).toBeVisible();
  await expect(page.locator("[data-toast]")).toHaveCount(0);

  await page.locator("section").getByRole("button", { name: "Delete account" }).click();
  await say("First failure", "danger");
  await say("Can't reach the server", "danger");
  const inline = dialog.getByRole("alert");
  await expect(inline).toHaveText("Can't reach the server");
  await expect(inline).toHaveClass(/alert danger/);
  // above the actions, and no second copy of the first failure
  expect(await inline.evaluate((el) => el.nextElementSibling.tagName)).toBe("FOOTER");
  await expect(dialog.locator("[data-toast]")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("[data-toast]")).toHaveCount(0);
  await expect(toaster.getByText("Can't reach the server")).toBeVisible();
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
  await expect(confirm).toHaveAttribute("aria-disabled", "true");
  // nothing closes it while the request runs
  await page.keyboard.press("Escape");
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

// the list page's cards, count, Clear and drawer
const listPage = (page) => {
  const dt = page.locator(".datatable");
  return {
    dt,
    rows: dt.locator("tbody tr"),
    summary: dt.getByRole("status"),
    count: dt.locator(".header").getByText(/\d+ products?$/),
    card: (status) => page.getByRole("navigation", { name: "Filter by status" }).getByRole("link", { name: new RegExp(`^${status}`) }),
    drawer: page.getByRole("dialog", { name: "Filters" }),
    statusColumn: dt.locator("tbody td:nth-child(4)"),
  };
};

test("list page: a multiple filter survives the server renumbering its URL, and can be added to and cleared", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, summary, drawer } = listPage(page);
  const category = drawer.getByRole("combobox", { name: "Category", exact: true });
  await expect(summary).toHaveText("Showing 1–10 of 14");

  await dt.getByRole("button", { name: "Filters" }).click();
  await expect(category).toHaveText("All");
  await category.click();
  const options = drawer.getByRole("listbox", { name: "Category" }).getByRole("option");
  const [one, two] = [await options.first().textContent(), await options.nth(1).textContent()];
  await options.first().click();
  await page.keyboard.press("Escape");
  await drawer.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/category%5B0%5D=/);
  await expect(summary).toContainText("filtered from 14");

  // the server's renumbered URL reads back into the drawer, and a second value adds to it
  await dt.getByRole("button", { name: /^Filters/ }).click();
  await expect(category).toContainText(one);
  await category.click();
  await options.nth(1).click();
  await page.keyboard.press("Escape");
  await drawer.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/category%5B1%5D=/);

  await dt.getByRole("button", { name: /^Filters/ }).click();
  await expect(category).toContainText(`${one}, ${two}`);
  await drawer.getByRole("button", { name: "Clear Category" }).click();
  await drawer.getByRole("button", { name: "Apply" }).click();
  await expect(page).not.toHaveURL(/category/);
  await expect(summary).toHaveText("Showing 1–10 of 14");
});

test("list page: a status card filters, counts what its link would show, and takes its filter off again", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, rows, count, card, statusColumn } = listPage(page);
  await expect(count).toHaveText("14 products");
  await expect(card("Active")).toContainText("10");
  await expect(card("Draft")).toContainText("3");
  await expect(card("Archived")).toContainText("1");
  // a link to the list with that status, for a new tab (here the stand-in's demo page for /products)
  await expect(card("Draft")).toHaveAttribute("href", /\?status=Draft$/);

  await card("Draft").click();
  await expect(page).toHaveURL(/status=Draft/);
  await expect(rows).toHaveCount(3);
  await expect(statusColumn).toHaveText(Array(3).fill("Draft"));
  await expect(card("Draft")).toHaveAttribute("aria-current", "true");
  await expect(card("Draft")).toHaveAccessibleName(/remove this filter/);
  await expect(count).toHaveText("3 of 14 products");
  // the drawer's Status is the same filter, and its badge counts it
  await expect(dt.getByRole("button", { name: /^Filters/ })).toContainText("1");

  // the counts follow the search, whatever the status
  await dt.getByRole("searchbox").fill("loop");
  await expect(page).toHaveURL(/search=loop/);
  await expect(card("Active")).toContainText("1");
  await expect(card("Draft")).toContainText("1");
  await expect(card("Archived")).toContainText("0");
  await expect(rows).toHaveCount(1);

  // another card replaces the status; the current one takes it off
  await card("Active").click();
  await expect(page).toHaveURL(/status=Active/);
  await expect(card("Draft")).not.toHaveAttribute("aria-current");
  await card("Active").click();
  await expect(page).not.toHaveURL(/status=/);
  await expect(page).toHaveURL(/search=loop/);
  await expect(rows).toHaveCount(2);
});

test("list page: Clear under the title empties the search and filters, and focus goes to the search box", async ({ page }) => {
  await page.goto("/app/recipe-products.html?status=Archived&search=mono");
  const { dt, rows, count } = listPage(page);
  await expect(rows).toHaveCount(1);
  await expect(count).toHaveText("1 of 14 products");

  // nothing matches: the empty row says so, and leaves Clear to the line under the title
  await dt.getByRole("searchbox").fill("monox");
  await expect(dt.locator("tbody td[colspan]")).toHaveText("No products match.");
  await expect(dt.locator("tbody").getByRole("button")).toHaveCount(0);

  const clear = dt.locator(".header").getByRole("button", { name: "Clear" });
  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/status=|search=/);
  await expect(count).toHaveText("14 products");
  await expect(clear).toBeHidden();
  await expect(rows).toHaveCount(10);
  await expect(dt.getByRole("searchbox")).toBeFocused();
  await expect(dt.getByRole("searchbox")).toHaveValue("");
});

test("list page: a change made before the last response lands builds on it instead of losing it", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, summary, card } = listPage(page);
  await expect(summary).toHaveText("Showing 1–10 of 14");

  // the stand-in server takes 200ms, so the sort lands while the card's visit is on its way;
  // from inside the page, so the two land inside those 200ms however busy the machine is
  await page.evaluate(async () => {
    document.querySelector('nav[aria-label="Filter by status"] a').click();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const sort = document.querySelector(".datatable select.sort");
    sort.value = [...sort.options].find((o) => o.text === "Price, high to low").value;
    sort.dispatchEvent(new Event("change"));
  });
  await expect(page).toHaveURL(/status=Active/);
  await expect(page).toHaveURL(/sort=price/);
  await expect(card("Active")).toHaveAttribute("aria-current", "true");
  await expect(dt.locator("select.sort")).toHaveValue(/./);
  await expect(dt.locator("select.sort").locator("option:checked")).toHaveText("Price, high to low");

  // a card while a typed search waits its turn
  await dt.getByRole("searchbox").fill("o");
  await page.waitForTimeout(150);
  await card("Draft").click();
  await expect(page).toHaveURL(/status=Draft/);
  await expect(page).toHaveURL(/search=o/);
  await expect(card("Draft")).toHaveAttribute("aria-current", "true");
});

test("list page: a second click on a header before the answer turns the sort round again", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, summary } = listPage(page);
  await expect(summary).toHaveText("Showing 1–10 of 14");
  await dt.getByRole("button", { name: "Price", exact: true }).evaluate(async (button) => {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 30));
    button.click();
  });
  await expect(page).toHaveURL(/sort=price/);
  await expect(page).toHaveURL(/dir=desc/);
  await expect(dt.locator('th[aria-sort="descending"]')).toHaveText("Price");
});

test("list page: the sort select stands in for the headers until the last of them has room", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app/recipe-products.html");
  const { dt, rows } = listPage(page);
  const sort = dt.getByRole("combobox", { name: "Sort" });
  await expect(dt.getByRole("columnheader", { name: "Updated" })).toBeHidden();
  await sort.selectOption({ label: "Updated, newest first" });
  await expect(page).toHaveURL(/sort=updated_at&dir=desc/);
  await expect(rows.first()).toContainText("Field portable");
  // a header click the select has no option for reads as a custom order
  await dt.getByRole("button", { name: "Stock", exact: true }).click();
  await dt.getByRole("button", { name: "Stock", exact: true }).click();
  await expect(page).toHaveURL(/sort=stock&dir=desc/);
  await expect(sort.locator("option:checked")).toHaveText("Custom order");

  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(dt.getByRole("columnheader", { name: "Updated" })).toBeVisible();
  await expect(sort).toBeHidden();
});

test("list page: a row opens from anywhere on it, its checkbox still ticks, and the way back is the list as it was left", async ({ page }) => {
  await page.goto("/app/recipe-products.html?status=Active&sort=price");
  const { dt, rows } = listPage(page);
  await expect(rows).toHaveCount(10);

  await rows.first().getByRole("checkbox").click();
  await expect(rows.first().getByRole("checkbox")).toBeChecked();
  await expect(page).toHaveURL(/recipe-products\.html/);
  await rows.first().getByRole("checkbox").click();

  // a click on the category cell is a click on the row's link
  const name = await rows.nth(1).getByRole("link").textContent();
  // forced, as Playwright refuses a cell another element covers: that cover is the point
  await rows.nth(1).locator("td").nth(2).click({ force: true });
  await expect(page).toHaveURL(/recipe-product\.html\?id=\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/recipe-products\.html\?status=Active&sort=price$/);
  await expect(rows).toHaveCount(10);
});

test("list page: no width between a phone and a wide screen scrolls the page sideways, and the toolbar shares a phone's row", async ({ page }) => {
  for (const width of [320, 390, 768, 900, 1024, 1208, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/app/recipe-products.html");
    await expect(listPage(page).rows).toHaveCount(10);
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scroll, `at ${width}px`).toBeLessThanOrEqual(client);
  }
  await page.setViewportSize({ width: 390, height: 800 });
  const { dt } = listPage(page);
  const [search, filters, sort] = await Promise.all([dt.getByRole("searchbox"), dt.getByRole("button", { name: "Filters" }), dt.getByRole("combobox", { name: "Sort" })].map((l) => l.boundingBox()));
  expect(filters.y).toBeGreaterThan(search.y + search.height - 1);
  expect(Math.abs(filters.y - sort.y)).toBeLessThan(2);
  expect(Math.abs(filters.width - sort.width)).toBeLessThan(2);
});

test("list page: a visit that reloads the rows dims the table, and a save does not", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, rows, card } = listPage(page);
  await expect(rows).toHaveCount(10);
  await dt.locator("table").evaluate((table) => {
    window.dims = 0;
    new MutationObserver(() => { if (table.getAttribute("aria-busy") === "true") window.dims++; }).observe(table, { attributeFilter: ["aria-busy"] });
  });

  await card("Draft").click();
  await expect(rows).toHaveCount(3);
  expect(await page.evaluate(() => window.dims)).toBeGreaterThan(0);

  await page.evaluate(() => { window.dims = 0; });
  await rows.first().getByRole("checkbox").check();
  await dt.getByRole("button", { name: "Archive" }).click();
  await expect(rows).toHaveCount(2);
  expect(await page.evaluate(() => window.dims)).toBe(0);
});

test("app shell: focus on main shows after a keyboard visit, inside the window", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const link = page.getByRole("link", { name: "Arc headphones", exact: true }), main = page.locator("#main");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/recipe-product\.html\?id=1$/);
  await expect(main).toBeFocused();
  expect(await main.evaluate((el) => { const s = getComputedStyle(el); return [s.outlineStyle, s.outlineWidth, s.outlineOffset]; })).toEqual(["solid", "3px", "-3px"]);
});

test("list page: the server searches, filters and pages, and a bulk action runs on ids or on everything matching", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, rows, summary, card, statusColumn } = listPage(page);
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

  // ids: a status card, then one ticked row
  await card("Draft").click();
  await expect(page).toHaveURL(/status=Draft/);
  await expect(rows).toHaveCount(3);
  await rows.first().getByRole("checkbox").check();
  await dt.getByRole("button", { name: "Archive" }).click();
  await expect(toast(page)).toHaveText("1 product archived.");
  await expect(rows).toHaveCount(2);
  await expect(dt.locator(".bulk")).toBeHidden();
  await expect(card("Archived")).toContainText("2");

  // matching: the page, then the rest of the query, which the server runs again
  await card("Active").click();
  await expect(summary).toHaveText("Showing 1–10 of 10, filtered from 14");
  await card("Active").click();
  await expect(summary).toContainText("of 14");
  await dt.getByRole("checkbox", { name: /Select every .* row on this page/ }).check();
  await dt.getByRole("button", { name: "Select all 14 matching" }).click();
  await dt.getByRole("button", { name: "Archive" }).click();
  await expect(toast(page).last()).toHaveText("14 products archived.");
  await expect(statusColumn).toHaveText(Array(10).fill("Archived"));
  await expect(card("Archived")).toContainText("14");
  // "matching" re-runs the query from Product::visibleTo(), so another team's product, never listed, is untouched
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).products.find((p) => p.team_id === 2).status)).toBe("Active");

  // a row's name is an Inertia visit to the edit page
  await dt.getByRole("link", { name: "Arc headphones", exact: true }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Arc headphones");
  // a visit to a new page puts focus on its main, not on <body> where the clicked link left it
  await expect(page.locator("#main")).toBeFocused();
});

test("list page: a table visit another listener cancels is forgotten, not carried into the next change", async ({ page }) => {
  await page.goto("/app/recipe-products.html");
  const { dt, rows, card } = listPage(page);
  await expect(rows).toHaveCount(10);
  // what an unsaved-changes guard does when the reader presses Cancel
  await page.evaluate(() => {
    window.cancelVisits = (event) => event.preventDefault();
    document.addEventListener("inertia:before", window.cancelVisits);
  });
  await card("Draft").click();
  await page.evaluate(() => document.removeEventListener("inertia:before", window.cancelVisits));
  await expect(page).not.toHaveURL(/status=/);

  await dt.getByRole("button", { name: /^Price/ }).click();
  await expect(page).toHaveURL(/sort=price/);
  await expect(page).not.toHaveURL(/status=/);
  await expect(rows).toHaveCount(10);
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
  // a delete the server never got puts the file back in its place, with an error, as the photo is still stored
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Remove front.png" }).click();
  await expect(files.filter({ hasText: "front.png" })).toContainText("The photo was not removed. Try again.");
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).photos.length)).toBe(1);
  await page.context().setOffline(false);
  await page.getByRole("button", { name: "Remove front.png" }).click();
  await expect(files).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("demo-recipes")).photos.length)).toBe(0);

  // two removals failing together come back in the order the files were added
  await page.locator("#photos").setInputFiles(["a", "b", "c"].map((n) => ({ name: `${n}.png`, mimeType: "image/png", buffer: png })));
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Remove a.png" }).click();
  await page.getByRole("button", { name: "Remove b.png" }).click();
  await expect(files.filter({ hasText: "The photo was not removed." })).toHaveCount(2);
  expect(await files.evaluateAll((items) => items.map((li) => li.textContent.match(/[abc]\.png/)[0]))).toEqual(["a.png", "b.png", "c.png"]);
  await page.context().setOffline(false);
});

test("tags and photos: a photo removed once all of it has been sent is deleted when the server answers", async ({ page }) => {
  // the server takes a while to store the file after its last byte, and stores it even if the browser stops waiting
  await patchServer(page, "    } else await wait(200, config.signal);", "      await wait(1500);\n    } else await wait(200, config.signal);");
  await page.goto("/app/recipe-media.html?id=3");
  const stored = () => page.evaluate(() => (JSON.parse(sessionStorage.getItem("demo-recipes") ?? "{}").photos ?? []).filter((p) => p.name === "late.png").length);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  await page.locator("#photos").setInputFiles([{ name: "late.png", mimeType: "image/png", buffer: png }]);
  await expect.poll(() => page.getByRole("progressbar", { name: "Uploading late.png" }).evaluate((bar) => bar.value)).toBe(100);
  await page.getByRole("button", { name: "Remove late.png" }).click();
  await expect(page.locator(".dropzone li")).toHaveCount(0);
  // the server stores it after all, and the page deletes what it stored
  await page.waitForTimeout(2500);
  expect(await stored()).toBe(0);
  await expect(page.locator(".dropzone li")).toHaveCount(0);
});

test("tags and photos: a tag picked while the save is under way stays unsaved, and leaving asks", async ({ page }) => {
  await patchServer(page, "} else await wait(200, config.signal);", "} else await wait(1500, config.signal);");
  await page.goto("/app/recipe-media.html?id=3");
  const box = page.locator(".combobox"), trigger = box.getByRole("combobox", { name: "Tags", exact: true });
  const pick = async () => {
    await trigger.click();
    await box.locator('[role="option"][aria-selected="false"]').first().click();
    await page.keyboard.press("Escape");
  };
  await pick();
  await page.getByRole("button", { name: "Save tags" }).click();
  await pick();
  await expect(toast(page)).toHaveText("Tags saved.");
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(/recipe-media\.html\?id=3$/);
});

test("tags and photos: leaving with unsaved tags asks first", async ({ page }) => {
  await page.goto("/app/recipe-media.html?id=3");
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  const box = page.locator(".combobox"), trigger = box.getByRole("combobox", { name: "Tags", exact: true });
  await trigger.click();
  await box.getByRole("option", { name: "Analog" }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toContainText("Analog");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" }).click();
  await expect.poll(() => asked).toEqual(["Leave this page? Your changes won't be saved."]);
  await expect(page).toHaveURL(/recipe-media\.html\?id=3$/);
  await expect(trigger).toContainText("Analog");
});

test("user menu: the avatar in the header opens a menu with the shared user's name and email, and Log out posts and leaves the app", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/app/recipe-products.html");
  const avatar = page.locator("header").getByRole("button", { name: "User menu" });
  await expect(avatar).toHaveText("ST");
  await avatar.click();
  const menu = page.locator("#user-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Sam Taylor");
  await expect(menu).toContainText("sam@forma.test");
  // lined up with the avatar's right edge, and on screen on a phone
  const [a, m] = [await avatar.boundingBox(), await menu.boundingBox()];
  expect(Math.abs(a.x + a.width - (m.x + m.width))).toBeLessThan(1);
  expect(m.x).toBeGreaterThanOrEqual(0);
  await menu.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/(index\.html)?$/);
});

// A page with `now` and an Inertia date cast, standing in for Settings: the demo has no such form, so the served
// server.js gains one, written with h() as the browser gets no template compiler. The imports reuse the URLs Vite
// gave server.js's own, so the page shares its Vue and Inertia.
const routeDatePage = (page) => page.route("**/app/server.js*", async (route) => {
  const response = await route.fetch();
  const served = await response.text();
  const inertia = served.match(/from "([^"]*@inertiajs_vue3[^"]*)"/)[1], ui = served.match(/from "([^"]*)\/dataTable\.ts"/)[1];
  const body = `import { h as $h, onMounted as $onMounted } from "${inertia.replace("@inertiajs_vue3", "vue")}";
import { useForm as $useForm } from "${inertia}";
import $Field from "${ui}/Field.vue";
import $AppLayout from "/app/layouts/AppLayout.vue";
const $Release = { setup() {
  const form = $useForm({ name: "", released: "", shipped: "2026-10-13T09:30:00.000000Z" });
  $onMounted(() => form.defaults());
  const field = (key, attrs) => $h($Field, { modelValue: form[key], "onUpdate:modelValue": (v) => (form[key] = v), name: key, ...attrs });
  return () => $h($AppLayout, { breadcrumb: [{ label: "Release" }] }, () => $h("form", [
    field("name"), field("released", { type: "date", now: true }), field("shipped", { type: "date" }),
    $h("output", JSON.stringify({ released: form.released, shipped: form.shipped, isDirty: form.isDirty })),
  ]));
} };
${served}`.replace('const settings = () => page("settings/Account", {});', 'const settings = () => page("Release", {});')
    .replace("resolve: (name) =>", 'resolve: (name) => name === "Release" ? $Release :');
  expect(body).toContain('page("Release", {})');
  expect(body).toContain("$Release :");
  await route.fulfill({ response, body });
});

test("date fields: `now` and a trimmed ISO date show in the input on a visit as on a page load, and the form's defaults take them", async ({ page }) => {
  await routeDatePage(page);
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const released = page.getByLabel("Released"), shipped = page.getByLabel("Shipped");
  const check = (how) => test.step(how, async () => {
    // the model and the input agree, and the filled values are the defaults, so the form starts clean
    await expect(page.locator("form output")).toHaveText(JSON.stringify({ released: today, shipped: "2026-10-13", isDirty: false }));
    await expect(released).toHaveValue(today);
    await expect(shipped).toHaveValue("2026-10-13");
    // a render of the form for another field leaves them as they are
    await page.getByLabel("Name").fill("Spring catalogue");
    await expect(page.locator("form output")).toContainText('"isDirty":true');
    await expect(released).toHaveValue(today);
    await expect(shipped).toHaveValue("2026-10-13");
  });
  await page.goto("/app/recipe-settings.html");
  await check("page load");
  // an Inertia visit mounts the page while the app re-renders, which is where the input lost the value
  await page.goto("/app/recipe-product.html?id=2");
  await page.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/recipe-settings\.html$/);
  await check("Inertia visit");
});
