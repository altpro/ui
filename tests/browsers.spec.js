// Small engine matrix for the native HTML and CSS features altpro/ui depends on.
// Chromium runs this alongside the detailed accessibility suite; Firefox and
// WebKit run this file only so browser-specific pixel checks stay meaningful.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";

const pages = ["button.html", "field.html", "dropdown.html", "multiselect.html", "datatable.html", "dialog.html", "tabs.html", "app/product.html"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const colorScheme of ["light", "dark"]) {
  for (const path of pages) {
    test(`${path} passes an ${colorScheme} engine smoke scan`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/" + path);
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
}

test("native disclosure and popover interactions work", async ({ page }) => {
  await page.goto("/accordion.html");
  const disclosure = page.locator("main details").nth(1);
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  await page.goto("/dropdown.html");
  const trigger = page.locator("main [popovertarget]").first();
  const target = page.locator("#" + await trigger.getAttribute("popovertarget"));
  await trigger.click();
  await expect(target).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(target).toBeHidden();
});

test("the sample app tabs expose valid complete panels", async ({ page }) => {
  await page.goto("/app/product.html");
  const tabs = page.locator("main .tabs > label");
  const panels = page.locator("main .tabs > div");
  await expect(tabs).toHaveCount(4);
  await expect(panels).toHaveCount(4);
  for (const tab of await tabs.all()) {
    await tab.click();
    const visiblePanels = await panels.evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== "none").length);
    expect(visiblePanels).toBe(1);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  }
});

for (const radius of ["0", "9999px"]) {
  test(`the sample app fits a mobile viewport at radius ${radius}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/product.html");
    await page.evaluate((value) => document.documentElement.style.setProperty("--radius", value), radius);
    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(widths.document).toBe(widths.viewport);
  });
}

test('product panels and pack editor fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/product.html');
  for (const tab of await page.locator('main .tabs > label').all()) {
    await tab.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
  await page.locator('main .tabs > label').first().click();
  await page.getByRole('button', { name: 'Edit 32 tablets', exact: true }).click();
  const dialog = page.locator('#variant-dialog');
  await expect(dialog).toHaveCSS('opacity', '1');
  await dialog.locator('details').evaluateAll((els) => els.forEach((el) => el.open = true));
  const widths = await dialog.evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }));
  expect(widths.scroll).toBe(widths.client);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Edit 32 tablets', exact: true })).toBeFocused();
});

test('coloured divided card sections reach the edges and keep their content inset', async ({ page }) => {
  await page.goto('/card.html');
  for (const radius of ['0', '0.5rem', '9999px']) {
    for (const padding of ['1rem', '1.5rem']) {
      const boxes = await page.evaluate(({ radius, padding }) => {
        const card = document.createElement('div');
        card.className = 'card divided';
        card.style.cssText = `--radius: ${radius}; --card-p: ${padding};`;
        card.innerHTML = '<header class="bg-muted"><h3>Title</h3></header><p>Body</p><footer class="bg-muted"><span>Footer</span></footer>';
        document.querySelector('main').append(card);
        const rect = el => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        const header = card.querySelector('header'), footer = card.querySelector('footer');
        const result = {
          card: rect(card), header: rect(header), footer: rect(footer),
          title: rect(header.firstElementChild), label: rect(footer.firstElementChild),
          padding: parseFloat(getComputedStyle(card).paddingTop),
          headerRadius: getComputedStyle(header).borderTopLeftRadius,
          footerRadius: getComputedStyle(footer).borderBottomLeftRadius,
        };
        card.remove(); return result;
      }, { radius, padding });
      expect(boxes.header.top).toBeCloseTo(boxes.card.top + 1);
      expect(boxes.footer.bottom).toBeCloseTo(boxes.card.bottom - 1);
      for (const section of [boxes.header, boxes.footer]) {
        expect(section.left).toBeCloseTo(boxes.card.left + 1);
        expect(section.right).toBeCloseTo(boxes.card.right - 1);
      }
      expect(boxes.title.top - boxes.header.top).toBeCloseTo(boxes.padding);
      expect(boxes.footer.bottom - boxes.label.bottom).toBeCloseTo(boxes.padding);
      expect(boxes.headerRadius).toBe(boxes.footerRadius);
    }
  }
});

// The Blade component rendered by PHP, with the same props as the Vue instances on multiselect.html.
const render = (tag) => execFileSync("php", ["tests/blade.php", tag], { encoding: "utf8" });
const blade = render(`<x-ui::multiselect name="size" label="Size" required max="2" :options="['s' => 'Small', 'm' => 'Medium', 'l' => 'Large']" :selected="['m']" />`);
const bladeDisabled = render(`<x-ui::multiselect name="colour" label="Colour" form="elsewhere" disabled :options="['b' => 'Black', 'w' => 'White']" :selected="['b']" />`);
const withBlade = async (page) => {
  await page.goto("/multiselect.html");
  await page.locator("#vue-demo .multiselect").first().waitFor();
  await page.addStyleTag({ content: "* { transition: none !important }" });
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `<form id="blade">${html}<button class="btn">Save</button></form>`), blade);
  return page.locator("#blade .multiselect");
};

test("multiselect: the Blade and Vue components render the same markup", async ({ page }) => {
  await withBlade(page);
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `<div id="blade-disabled">${html}</div>`), bladeDisabled);
  for (const [blade, vue] of [["#blade .multiselect", "#vue-demo .multiselect >> nth=0"], ["#blade-disabled .multiselect", "#vue-demo .multiselect >> nth=1"]]) {
  const [b, v] = await Promise.all([blade, vue].map((selector) => page.locator(selector).evaluate((el) => {
    // attributes minus the generated id pair, plus live input state (Vue sets checked as a property)
    const shape = (n) => n.nodeType === 3 ? n.data.trim() || null : n.nodeType !== 1 ? null : [
      n.localName,
      [...n.attributes].filter((a) => !["id", "popovertarget", "value", "checked"].includes(a.name)).map((a) => `${a.name}=${a.value}`).sort(),
      n.localName === "input" ? [n.value, n.checked] : [],
      [...n.childNodes].map(shape).filter((x) => x !== null),
    ];
    return { linked: el.querySelector("button").popoverTargetElement === el.querySelector("[popover]"), shape: shape(el) };
  })));
  expect([b.linked, v.linked]).toEqual([true, true]);
  expect(b.shape).toEqual(v.shape);
  }
});

test("multiselect: required, max, form and disabled work as on a select", async ({ page }) => {
  const ms = await withBlade(page);
  const [button, panel, save] = [ms.locator("button"), ms.locator("[popover]"), page.locator("#blade > .btn")];
  const userInvalid = () => ms.evaluate((el) => el.matches(":state(touched):invalid"));
  await button.scrollIntoViewIfNeeded();
  expect(await userInvalid()).toBe(false);

  // max="2": at two ticks the third box is disabled, at one it is back
  await button.click();
  await panel.getByLabel("Small").check();
  await expect(panel.getByLabel("Large")).toBeDisabled();
  await panel.getByLabel("Small").uncheck();
  await expect(panel.getByLabel("Large")).toBeEnabled();
  // removing max frees the boxes it disabled, and only those
  await panel.getByLabel("Small").check();
  await ms.evaluate((el) => { el.querySelector("[value=m]").disabled = true; el.removeAttribute("max"); });
  await expect(panel.getByLabel("Large")).toBeEnabled();
  await expect(panel.getByLabel("Medium")).toBeDisabled();
  await ms.evaluate((el) => { el.querySelector("[value=m]").disabled = false; el.setAttribute("max", "2"); });
  await panel.getByLabel("Small").uncheck();

  // required: nothing ticked stops the submit with the browser's message, on the button
  await panel.getByLabel("Medium").uncheck();
  await page.keyboard.press("Escape");
  await save.click();
  await expect(button).toBeFocused();
  expect(await userInvalid()).toBe(true);
  expect(await ms.evaluate((el) => el.matches(":invalid") && document.querySelector("#blade").checkValidity())).toBe(false);
  // the panel still takes clicks after the bubble (Firefox stopped when it pointed into the panel)
  await button.click();
  await panel.getByLabel("Large").check();
  await page.keyboard.press("Escape");
  expect(await userInvalid()).toBe(false);
  await Promise.all([page.waitForURL(/size%5B%5D=l$/), save.click()]);

  // form="…": an empty required multiselect outside its form still stops that form
  await page.goto("/multiselect.html");
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `${html}<form id="other"><button class="btn">Send</button></form>`),
    render(`<x-ui::multiselect name="colour" label="Colour" form="other" required :options="['b' => 'Black', 'w' => 'White']" />`));
  const outside = page.locator("main > .multiselect");
  await page.locator("#other .btn").click();
  await expect(outside.locator("button")).toBeFocused();
  await outside.locator("button").click();
  await outside.getByLabel("White").check();
  await page.keyboard.press("Escape");
  await Promise.all([page.waitForURL(/colour%5B%5D=w$/), page.locator("#other .btn").click()]);

  // disabled: the button cannot open the panel and the boxes are not submitted
  await page.goto("/multiselect.html");
  const disabled = page.locator("#vue-demo .multiselect").nth(1);
  await expect(disabled.locator("button")).toBeDisabled();
  await expect(disabled.locator("input").first()).toBeDisabled();
});

test("multiselect: the button shows the ticked items, and the count once they overflow", async ({ page }) => {
  const ms = await withBlade(page);
  const [button, panel, save] = [ms.locator("button"), ms.locator("[popover]"), page.locator("#blade > .btn")];
  const overflows = () => ms.evaluate((el) => el.matches(":state(overflow)"));
  const count = () => button.evaluate((b) => getComputedStyle(b, "::before").display);
  await expect(button).toHaveAccessibleName("Size Medium");
  expect([await overflows(), await count()]).toEqual([false, "none"]);
  // ticked from code while closed: the change event is what updates the button
  await panel.evaluate((p) => { const box = p.querySelector("[value=s]"); box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); });
  await expect(button).toHaveAccessibleName("Size Small, Medium");
  await expect(button).toHaveAttribute("data-count", "2");
  // narrower than the items: an ellipsis, then the count
  await ms.evaluate((el) => (el.style.width = "7rem"));
  await expect.poll(overflows).toBe(true);
  expect(await count()).not.toBe("none");
  await ms.evaluate((el) => (el.style.width = ""));
  await expect.poll(overflows).toBe(false);

  await button.click();
  await expect(panel).toBeVisible();
  await panel.getByLabel("Small").uncheck();
  await panel.getByLabel("Medium").uncheck();
  await expect(button).toHaveAttribute("data-count", "0");
  await expect(button).toHaveAccessibleName("Size"); // nothing ticked: empty, as a select with no value
  await panel.getByLabel("Large").check();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(button).toHaveAccessibleName("Size Large");
  await Promise.all([page.waitForURL(/size%5B%5D=l$/), save.click()]);
});

test("multiselect: keyboard moves between the button and the panel", async ({ page }) => {
  await page.goto("/multiselect.html");
  const button = page.locator("[popovertarget=f-size]");
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.value)).toBe("s");
  await page.keyboard.press("Space");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.locator("#f-size")).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page.locator("#f-size [value=s]")).toBeChecked();
});

test("multiselect: Vue v-model follows the boxes and the count follows v-model", async ({ page }) => {
  const warnings = [];
  page.on("console", (m) => ["warning", "error"].includes(m.type()) && warnings.push(m.text()));
  await page.goto("/multiselect.html");
  const ms = page.locator("#vue-demo .multiselect").first(), count = ms.locator("button"), output = page.locator("#vue-demo output");
  await expect(count).toHaveAttribute("data-count", "1"); // v-model ticks its boxes after the element connects
  await ms.locator("button").click();
  await ms.getByLabel("Small").check();
  await expect(output).toHaveText('v-model: ["m","s"]');
  await expect(count).toHaveAttribute("data-count", "2");
  await expect(count).toHaveAccessibleName("Size Small, Medium");
  await page.keyboard.press("Escape");
  await page.locator("#vue-demo").getByRole("button", { name: "Clear" }).click();
  await expect(output).toHaveText("v-model: []");
  await expect(ms.locator("input:checked")).toHaveCount(0);
  await expect(count).toHaveAttribute("data-count", "0");
  await expect(count).toHaveAccessibleName("Size");
  // a required one emptied from code is invalid, as if the user had unticked it
  expect(await ms.evaluate((el) => el.matches(":invalid"))).toBe(true);
  expect(warnings).toEqual([]);
});

// The Blade field rendered with the same props as each Vue field on field.html, in the same order.
const fieldErrors = `['tags.1' => ['The selected tag is invalid.'], 'bio' => ['At least 20 characters.', 'Mention where you work.']]`;
const cats = `[['id' => 1, 'name' => 'News'], ['id' => 2, 'name' => 'Sport'], ['id' => 3, 'name' => 'Culture']]`;
const tagList = `[['id' => 1, 'name' => 'Laravel', 'slug' => 'laravel'], ['id' => 2, 'name' => 'Vue', 'slug' => 'vue'], ['id' => 3, 'name' => 'Tailwind', 'slug' => 'tailwind']]`;
const bladeFields = render([
  `<x-ui::field name="email" type="email" required autocomplete="email" hint="We never share it." />`,
  `<x-ui::field name="category_id" type="select" :options="${cats}" :value="['id' => 2, 'name' => 'Sport']" placeholder="Choose one" />`,
  `<x-ui::field name="tags" type="multiselect" :options="${tagList}" :value="collect(${tagList})->only([0, 2])" max="2" hint="Up to two." />`,
  `<x-ui::field name="price" type="number" prepend="£" step="0.01" value="12.50" />`,
  `<x-ui::field name="size" type="radio" :options="['s' => 'Small', 'm' => 'Medium', 'l' => 'Large']" value="m" />`,
  `<x-ui::field name="extras[]" type="checkbox" :options="['gift' => 'Gift wrap', 'card' => 'Card']" :value="['gift']" />`,
  `<x-ui::field name="newsletter" type="switch" label="Send me the newsletter" :value="true" />`,
  `<x-ui::field name="bio" type="textarea" rows="3" value="Hi" />`,
  `<x-ui::field name="published_on" type="date" now />`,
].map((tag) => tag.replace(" />", ` :errors="${fieldErrors}" />`)).join(""));

// `now` is today in the app's timezone for Blade (UTC under Testbench) and in the browser's for Vue
test.describe(() => { test.use({ timezoneId: "UTC" });
test("field: the Blade and Vue components render the same markup", async ({ page }) => {
  await page.goto("/field.html");
  await page.locator("#vue-demo .multiselect").waitFor();
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `<div id="blade">${html}</div>`), bladeFields);
  const shapes = (selector) => page.locator(selector).evaluateAll((fields) => fields.map((field) => {
    // generated ids become #0, #1… in order of appearance, so a label still has to point at its control
    const ids = [...field.querySelectorAll("[id]")].map((el) => el.id);
    if (field.id) ids.unshift(field.id);
    const token = (v) => v.split(" ").map((w) => (ids.includes(w) ? `#${ids.indexOf(w)}` : w)).join(" ");
    // live state rather than attributes: Vue sets value, checked and selected as properties
    const shape = (n) => n.nodeType === 3 ? n.data.trim() || null : n.nodeType !== 1 ? null : [
      n.localName,
      [...n.attributes].filter((a) => !["value", "checked", "selected"].includes(a.name))
        .map((a) => `${a.name}=${a.value === a.name ? "" : ["id", "for", "aria-describedby", "popovertarget"].includes(a.name) ? token(a.value) : a.value}`).sort(),
      ["input", "select", "textarea", "option"].includes(n.localName) ? [n.value, n.checked, n.selected] : [],
      n.localName === "textarea" ? [] : [...n.childNodes].map(shape).filter((x) => x !== null),
    ];
    return shape(field);
  }));
  const [blade, vue] = await Promise.all([shapes("#blade > .field"), shapes("#vue-demo > .field")]);
  expect(blade.length).toBe(9);
  for (const [i, shape] of vue.entries()) expect(blade[i], `field ${i + 1}`).toEqual(shape);
});
});

test("field: labels, hints and errors reach the control, and models go out as ids", async ({ page }) => {
  await page.goto("/field.html");
  const demo = page.locator("#vue-demo"), output = demo.locator("output");
  await expect(demo.getByLabel("Email")).toHaveAccessibleDescription("We never share it.");
  await expect(demo.getByRole("textbox", { name: "Bio" })).toHaveAccessibleDescription("At least 20 characters. Mention where you work.");
  await expect(demo.getByRole("textbox", { name: "Bio" })).toHaveAttribute("aria-invalid", "true");
  await expect(demo.getByRole("button", { name: /^Tags Laravel ?, Tailwind$/ })).toHaveAccessibleDescription("Up to two. The selected tag is invalid.");
  await expect(demo.getByRole("group", { name: "Size" })).toBeVisible();
  await expect(demo.getByRole("switch", { name: "Send me the newsletter" })).toBeChecked();

  await demo.getByLabel("Category").selectOption("Culture");
  await expect(output).toContainText('"category_id":3');
  await demo.getByRole("button", { name: /^Tags/ }).click();
  await demo.getByLabel("Laravel").uncheck();
  await page.keyboard.press("Escape");
  await expect(output).toContainText('"tags":[3]');
  await demo.getByLabel("Card").check();
  await expect(output).toContainText('"extras":["gift","card"]');
  await demo.getByLabel("Price").fill("9");
  await expect(output).toContainText('"price":9');
  // `now` shows today and puts it in the model, not just the input
  const today = await page.evaluate(() => new Date().toLocaleDateString("sv"));
  await expect(demo.getByLabel("Published on")).toHaveValue(today);
  await expect(output).toContainText(`"published_on":"${today}"`);
});

test("field: inside Inertia's <Form>, reset() sticks when the fields render again", async ({ page }) => {
  await page.goto("/field.html");
  const form = page.locator("#inertia-demo form"), topics = form.getByRole("button", { name: /^Topics/ });
  await expect(form.getByLabel("Headline")).toHaveValue("Hello");
  await expect(topics).toHaveAttribute("data-count", "1");
  await form.getByLabel("Headline").fill("Changed");
  await topics.click();
  await form.getByLabel("Vue").check();
  await page.keyboard.press("Escape");
  await form.getByRole("switch").check();
  const data = () => form.evaluate((f) => [...new FormData(f)].map(([k, v]) => `${k}=${v}`));
  expect(await data()).toEqual(["headline=Changed", "topics[]=1", "topics[]=2", "featured=1"]);

  await form.getByRole("button", { name: "Reset" }).click();
  await expect(topics).toHaveAttribute("data-count", "1");
  // the error renders every field again: v-model must not put "Changed" back
  await form.getByRole("button", { name: "Show an error" }).click();
  await expect(form.locator(".error")).toHaveText("An error from setError.");
  await expect(form.getByLabel("Headline")).toHaveValue("Hello");
  await expect(topics).toHaveAttribute("data-count", "1");
  expect(await data()).toEqual(["headline=Hello", "topics[]=1"]);
});

// DataTable: what the URL, filters and selection do, none of which axe can see.
// Each table is found by its caption, so inserting an example cannot shift a selector onto another table.
const datatable = (page, caption) => page.locator(".datatable").filter({ has: page.getByRole("table", { name: caption, exact: true }) });
const bodyRows = (dt) => dt.locator("tbody tr");

test("datatable: sorting writes the URL under the table's name, and aria-sort is on one column", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  await expect(dt.locator("th[aria-sort]")).toHaveText("Name");
  await dt.getByRole("button", { name: "Email" }).click();
  await expect(page).toHaveURL(/[?&]basic_sort=email/);
  expect(page.url()).not.toContain("products_sort");
  await expect(dt.locator("th[aria-sort]")).toHaveCount(1);
  await expect(dt.locator("th[aria-sort]")).toHaveAttribute("aria-sort", "ascending");
  await expect(bodyRows(dt).first()).toContainText("ada@example.com");
  await dt.getByRole("button", { name: "Email" }).click();
  await expect(dt.locator("th[aria-sort]")).toHaveAttribute("aria-sort", "descending");
  await expect(bodyRows(dt).first()).toContainText("margaret@example.com");
  // the URL is the state: a reload, or a link sent to someone, shows the same view
  await page.reload();
  await expect(datatable(page, "Team members").locator("th[aria-sort]")).toHaveAttribute("aria-sort", "descending");
  // sorting back to the default takes it out of the URL
  await datatable(page, "Team members").getByRole("button", { name: "Name" }).click();
  await expect(page).not.toHaveURL(/basic_sort/);
});

test("datatable: pages move through the URL, and the page size is kept on the device", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  const nav = dt.getByRole("navigation", { name: "Team members pagination" });
  await expect(nav.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await nav.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/basic_page=2/);
  await expect(nav.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  await expect(dt.getByRole("status")).toHaveText("Showing 6–7 of 7");
  await expect(bodyRows(dt)).toHaveCount(2);

  const products = datatable(page, "Products");
  await products.getByRole("combobox", { name: "Per page" }).selectOption("25");
  await expect(bodyRows(products)).toHaveCount(12);
  // a preference, not the view: kept on the device, out of the URL
  expect(page.url()).not.toContain("per_page");
  await page.reload();
  await expect(bodyRows(datatable(page, "Products"))).toHaveCount(12);
});

test("datatable: declared filters narrow the rows, sit in the URL and say how many they hid", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Products");
  await expect(dt.getByRole("status")).toHaveText("Showing 1–10 of 12");
  await dt.getByLabel("Availability").selectOption("out_of_stock");
  await expect(page).toHaveURL(/products_availability=out_of_stock/);
  await expect(bodyRows(dt)).toHaveCount(4);
  await expect(dt.getByRole("status")).toHaveText("Showing 1–4 of 4, filtered from 12");

  await dt.locator(".controls").getByRole("button", { name: /^Size/ }).click();
  await dt.getByRole("checkbox", { name: "L" }).check();
  await expect(page).toHaveURL(/products_size%5B%5D=L/);
  await expect(bodyRows(dt)).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dt.locator(".controls").getByRole("button", { name: /^Size/ })).toContainText("L");
});

test("datatable: a search that matches nothing says so in the table and offers to clear itself", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  await dt.getByRole("searchbox", { name: "Search Team members" }).fill("zzzz");
  const cell = dt.locator("tbody > tr:only-child > td[colspan]");
  await expect(cell).toContainText("No team members match your search.");
  // the count is what changes, so it is what a screen reader hears; the message is a different sentence
  await expect(dt.getByRole("status")).toHaveText("Showing 0 of 0, filtered from 7");
  await expect(page).toHaveURL(/basic_search=zzzz/);
  await cell.getByRole("button", { name: "Clear filters" }).click();
  await expect(bodyRows(dt)).toHaveCount(5);
  await expect(dt.getByRole("searchbox")).toHaveValue("");
  await expect(page).not.toHaveURL(/basic_search/);
});

test("datatable: an empty table carries its message in one spanning cell, and every table keeps a status", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Archived team members");
  await expect(bodyRows(dt)).toHaveCount(1);
  const cell = dt.locator("tbody td");
  await expect(cell).toHaveText("No archived members.");
  await expect(cell.getByRole("button")).toHaveCount(0);
  await expect(cell).toHaveAttribute("colspan", String(await dt.locator("thead th").count()));
  await expect(dt.getByRole("status")).toHaveText("Showing 0 of 0");
  // a live region inserted with its text announces nothing, so it must be there before anything is empty
  for (const table of await page.locator(".datatable").all()) await expect(table.getByRole("status")).not.toHaveText("");
});

test("datatable: the header box selects the page, and the rest of the matches is a separate offer", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Products under review"), output = page.locator("output");
  await dt.getByRole("checkbox", { name: "Select every Products under review row on this page" }).check();
  await expect(dt.locator("tbody input:checked")).toHaveCount(10);
  await expect(dt.locator(".bulk p")).toHaveText("10 selected");
  await expect(output).toContainText('"mode":"ids"');
  await dt.getByRole("button", { name: "Select all 12 matching" }).click();
  await expect(dt.locator(".bulk p")).toHaveText("12 selected");
  await expect(output).toContainText('"mode":"matching"');
  // a selection describes a list: change the list and it goes
  await dt.getByRole("searchbox").fill("tee");
  await expect(dt.locator(".bulk")).toHaveCount(0);
  await expect(output).toHaveText("selection: null");
  await dt.getByRole("checkbox", { name: "Select Trail Tee" }).first().check();
  await dt.getByRole("button", { name: "Discontinue" }).click();
  await expect(output).toHaveText("1 discontinued.");
  await expect(dt.locator("tbody input:checked")).toHaveCount(0);
});

test("datatable: hiding a column removes it from every row and survives a reload", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  await dt.getByRole("button", { name: "Columns" }).click();
  await dt.getByRole("group", { name: "Team members columns" }).getByRole("checkbox", { name: "Email" }).uncheck();
  await expect(dt.locator("thead th")).toHaveText(["Name", "Role"]);
  for (const row of await bodyRows(dt).all()) await expect(row.locator("td")).toHaveCount(2);
  await page.reload();
  await expect(datatable(page, "Team members").locator("thead th")).toHaveText(["Name", "Role"]);
});
