// useUnsavedChanges (references/unsaved-changes.md) where the recipe pages have no case of their own: a second guarded
// form, injected into the edit page as it is served, and leaveWithoutAsking.
import { test, expect } from "./fixtures.js";

// the edit page with a second guarded form, both reachable from the test
const withSecondForm = (page) => page.route("**/app/pages/products/Edit.vue*", async (route) => {
  const response = await route.fetch();
  const from = "useUnsavedChanges(form);";
  const body = (await response.text()).replace(from,
    `${from} const other = useForm({ note: "" }); useUnsavedChanges(other, { remember: "other" }); window.forms = { form, other };`);
  expect(body).toContain("window.forms");
  await route.fulfill({ response, body });
});

// a module as the page loaded it, so the test calls the same instance the page uses
const loaded = (page, name) => page.evaluate(async (name) => {
  const url = performance.getEntriesByType("resource").map((e) => e.name).find((n) => n.includes(name));
  return Object.keys((window.loaded ??= {})[name] = await import(url));
}, name);

const openEdit = async (page) => {
  await page.goto("/app/recipe-products.html");
  await page.getByRole("link", { name: "Edit Arc studio" }).click();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
};
const products = (page) => page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Products" });

test("two guarded forms with changes ask once, and both take the answer", async ({ page }) => {
  await withSecondForm(page);
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  await page.getByLabel("Name", { exact: true }).fill("first form's draft");
  await page.evaluate(() => (window.forms.other.note = "second form's draft"));

  const asked = [];
  let answer = false;
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return answer ? dialog.accept() : dialog.dismiss();
  });
  // Cancel: one question, and both forms stay as they were
  await products(page).click();
  await expect.poll(() => asked.length).toBe(1);
  await page.waitForTimeout(300);
  expect(asked).toHaveLength(1);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  expect(await page.evaluate(() => [window.forms.form.name, window.forms.other.note])).toEqual(["first form's draft", "second form's draft"]);

  // OK: one question, and the page goes
  answer = true;
  await products(page).click();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  expect(asked).toHaveLength(2);
});

test("leaveWithoutAsking lets one leave go unasked, and the next page's forms ask again", async ({ page }) => {
  await openEdit(page);
  await loaded(page, "useUnsavedChanges");
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.accept();
  });
  await page.getByLabel("Name", { exact: true }).fill("left for the next reader");
  await page.evaluate(() => window.loaded.useUnsavedChanges.leaveWithoutAsking());
  await products(page).click();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  expect(asked).toHaveLength(0);

  // the next reader's edits are guarded again
  await page.getByRole("link", { name: "Edit Arc studio" }).click();
  await page.getByLabel("Name", { exact: true }).fill("the next reader's edit");
  await products(page).click();
  await expect.poll(() => asked).toEqual(["Leave this page? Your changes won't be saved."]);
});

test("passwords stay out of the draft at any depth, and come back empty", async ({ page }) => {
  await page.route("**/app/pages/products/Edit.vue*", async (route) => {
    const response = await route.fetch();
    const from = "useUnsavedChanges(form);";
    const body = (await response.text()).replace(from, `${from}
      const secrets = useForm({ user: { name: "", password: "" }, accounts: [{ current_password: "" }], password_confirmation: "" });
      useUnsavedChanges(secrets, { remember: "secrets" }); window.forms = { form, secrets };`);
    expect(body).toContain("window.forms");
    await route.fulfill({ response, body });
  });
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  await page.evaluate(() => {
    const { secrets } = window.forms;
    secrets.user.name = "kept name";
    secrets.user.password = "hunter2-nested";
    secrets.accounts[0].current_password = "hunter2-listed";
    secrets.password_confirmation = "hunter2-top";
    secrets.defaults("user.password", "hunter2-default");
    secrets.defaults("accounts", [{ current_password: "hunter2-in-defaults" }]);
  });
  await expect.poll(() => page.evaluate(() => JSON.stringify(history.state))).toContain("kept name");
  expect(await page.evaluate(() => JSON.stringify(history.state))).not.toContain("hunter2");

  // Back, then Forward: the draft comes back, its passwords empty
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect.poll(() => page.evaluate(() => window.forms?.secrets.user.name)).toBe("kept name");
  expect(await page.evaluate(() => JSON.parse(JSON.stringify(window.forms.secrets.data())))).toEqual(
    { user: { name: "kept name", password: "" }, accounts: [{ current_password: "" }], password_confirmation: "" });
});

test("Log out, a post that lands on another page, asks first; the form's own save does not", async ({ page }) => {
  // the stand-in's logout is a full page load, which the browser's own prompt covers; as Laravel's starter kit has it,
  // the logout lands on a page in the app
  await page.route("**/app/server.js*", async (route) => {
    const response = await route.fetch();
    const from = '["POST", /^\\/logout$/, () => new Away("/")]';
    const text = await response.text();
    expect(text).toContain(from);
    await route.fulfill({ response, body: text.replace(from, '["POST", /^\\/logout$/, (m, q) => index(q)]') });
  });
  await openEdit(page);
  const asked = [];
  let answer = false;
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return answer ? dialog.accept() : dialog.dismiss();
  });
  const name = page.getByLabel("Name", { exact: true });
  await name.fill("not saved yet");
  const logOut = async () => {
    await page.getByRole("button", { name: /user menu/ }).click();
    await page.getByRole("button", { name: "Log out" }).click();
  };

  // Cancel: the page and the edit stay
  await logOut();
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(name).toHaveValue("not saved yet");

  // the form's own save goes unasked
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  expect(asked).toHaveLength(1);

  // with changes again, OK lets Log out go
  await name.fill("changed after saving");
  answer = true;
  await logOut();
  await expect(page).toHaveURL(/recipe-products\.html$|\/logout$/);
  expect(asked).toHaveLength(2);
});

// the stand-in's logout lands on the products list, as Laravel's starter kit's lands on a page in the app
const logoutInApp = (page, also = (text) => text) => page.route("**/app/server.js*", async (route) => {
  const response = await route.fetch();
  const from = '["POST", /^\\/logout$/, () => new Away("/")]';
  const text = await response.text();
  expect(text).toContain(from);
  await route.fulfill({ response, body: also(text.replace(from, '["POST", /^\\/logout$/, (m, q) => index(q)]')) });
});

test("another guarded form's save that comes back goes unasked and keeps this form's edits", async ({ page }) => {
  await withSecondForm(page);
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  await page.getByLabel("Name", { exact: true }).fill("Arc studio mk2");
  await page.evaluate(() => (window.forms.other.note = "not saved"));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  expect(await page.evaluate(() => window.forms.other.note)).toBe("not saved");
  expect(asked).toEqual([]);
});

test("another guarded form's save that lands on another page leaves this form's draft, for Back to bring", async ({ page }) => {
  await withSecondForm(page);
  await page.route("**/app/server.js*", async (route) => {
    const response = await route.fetch();
    const from = 'return back({ flash: { toast: { type: "success", message: "Product saved." } } });';
    const text = await response.text();
    expect(text).toContain(from);
    await route.fulfill({ response, body: text.replace(from, "return index(new URLSearchParams());") });
  });
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  await page.getByLabel("Name", { exact: true }).fill("Arc studio mk2");
  await page.evaluate(() => (window.forms.other.note = "not saved"));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  // the stand-in answers at the request's URL: the list, at /products/2
  await expect(page.getByRole("link", { name: "Edit Arc studio mk2" })).toBeVisible();
  expect(asked).toEqual([]);
  await page.goBack();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect.poll(() => page.evaluate(() => window.forms?.other.note)).toBe("not saved");
});

test("allowLeaving in onBefore lets a visit that ends the form's need go unasked", async ({ page }) => {
  await logoutInApp(page);
  await page.route("**/app/pages/products/Edit.vue*", async (route) => {
    const response = await route.fetch();
    const from = "useUnsavedChanges(form);";
    const body = (await response.text()).replace(from,
      `const { allowLeaving } = useUnsavedChanges(form); window.leave = () => useForm({}).post("/logout", { onBefore: allowLeaving });`);
    expect(body).toContain("window.leave");
    await route.fulfill({ response, body });
  });
  await openEdit(page);
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  await page.getByLabel("Name", { exact: true }).fill("about to go");
  await page.evaluate(() => window.leave());
  await expect(page).toHaveURL(/recipe-products\.html$|\/logout$/);
  expect(asked).toEqual([]);
});

test("the tags and photos page asks before Log out drops unsaved tags", async ({ page }) => {
  await logoutInApp(page);
  await page.goto("/app/recipe-media.html?id=3");
  const box = page.locator(".combobox");
  await box.getByRole("combobox", { name: "Tags", exact: true }).click();
  await box.locator('[role="option"][aria-selected="false"]').first().click();
  await page.keyboard.press("Escape");
  const asked = [];
  let answer = false;
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return answer ? dialog.accept() : dialog.dismiss();
  });
  const logOut = async () => {
    await page.getByRole("button", { name: /user menu/ }).click();
    await page.getByRole("button", { name: "Log out" }).click();
  };
  await logOut();
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(/recipe-media\.html\?id=3$/);
  answer = true;
  await page.keyboard.press("Escape");
  await logOut();
  await expect(page).toHaveURL(/recipe-products\.html$|\/logout$/);
  expect(asked).toHaveLength(2);
});

test("a visit allowLeaving let go, stopped by another guard's Cancel, puts the guard back", async ({ page }) => {
  await logoutInApp(page);
  await page.route("**/app/pages/products/Edit.vue*", async (route) => {
    const response = await route.fetch();
    const from = "useUnsavedChanges(form);";
    const body = (await response.text()).replace(from, `const { allowLeaving } = useUnsavedChanges(form);
      const other = useForm({ note: "" }); useUnsavedChanges(other, { remember: "other" }); window.forms = { form, other };
      window.leave = () => useForm({}).post("/logout", { onBefore: allowLeaving });`);
    expect(body).toContain("window.leave");
    await route.fulfill({ response, body });
  });
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  await page.getByLabel("Name", { exact: true }).fill("first form's edit");
  await page.evaluate(() => (window.forms.other.note = "second form's edit"));
  // the second form asks, and Cancel keeps the page
  await page.evaluate(() => window.leave());
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  // with the second form clean, leaving with the first form's edits asks again
  await page.evaluate(() => window.forms.other.reset());
  await page.getByLabel("Name", { exact: true }).fill("first form's edit, again");
  await products(page).click();
  await expect.poll(() => asked.length).toBe(2);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
});

test("the tags and photos page asks before Log out cuts off an upload", async ({ page }) => {
  await logoutInApp(page);
  await page.goto("/app/recipe-media.html?id=3");
  const asked = [];
  page.on("dialog", (dialog) => {
    asked.push(dialog.message());
    return dialog.dismiss();
  });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  await page.locator("#photos").setInputFiles([{ name: "slow.png", mimeType: "image/png", buffer: png }]);
  await expect(page.getByRole("progressbar", { name: "Uploading slow.png" })).toBeVisible();
  await page.getByRole("button", { name: /user menu/ }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(/recipe-media\.html\?id=3$/);
});

test("a visit allowLeaving let go, then stopped, keeps the form's draft for Back and Forward", async ({ page }) => {
  await logoutInApp(page);
  await page.route("**/app/pages/products/Edit.vue*", async (route) => {
    const response = await route.fetch();
    const from = "useUnsavedChanges(form);";
    const body = (await response.text()).replace(from, `const { allowLeaving } = useUnsavedChanges(form);
      const other = useForm({ note: "" }); useUnsavedChanges(other, { remember: "other" }); window.forms = { form, other };
      window.leave = () => useForm({}).post("/logout", { onBefore: allowLeaving });`);
    await route.fulfill({ response, body });
  });
  await openEdit(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.forms))).toBe(true);
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.getByLabel("Name", { exact: true }).fill("kept through a stopped leave");
  await page.evaluate(() => (window.forms.other.note = "second form's edit"));
  await page.waitForTimeout(300);
  // the second form asks, and Cancel stops the visit the first form had let go
  await page.evaluate(() => window.leave());
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  // with no more typing, Back and Forward bring the first form's edits
  await page.goBack();
  await expect(page).toHaveURL(/recipe-products\.html$/);
  await page.goForward();
  await expect(page).toHaveURL(/recipe-product\.html\?id=2$/);
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("kept through a stopped leave");
});
