// Small engine matrix for the native HTML and CSS features altpro/ui depends on.
// Chromium runs this alongside the detailed accessibility suite; Firefox and
// WebKit run this file only so browser-specific pixel checks stay meaningful.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";

const pages = ["button.html", "field.html", "dropdown.html", "combobox.html", "datatable.html", "dialog.html", "tabs.html", "app/product.html"];
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

// a branch that is a page: the link navigates without toggling, the summary over its gutter toggles from mouse and keyboard
test("tree: a page branch's link navigates and its 24px chevron toggles", async ({ page }) => {
  await page.goto("/tree.html");
  const li = page.locator("main .tree > li").nth(1);
  const [link, details, toggle] = [li.locator("> a"), li.locator("> details"), li.locator("> details > summary")];
  await link.click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(details).toHaveAttribute("open", "");
  const [a, s] = [await link.boundingBox(), await toggle.boundingBox()];
  expect(s.width).toBeGreaterThanOrEqual(24);
  expect(s.height).toBeGreaterThanOrEqual(24);
  expect([s.x, s.y]).toEqual([a.x, a.y]);
  await toggle.click();
  await expect(details).not.toHaveAttribute("open");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  await expect(toggle).toHaveAccessibleName("About us");
});

test("the sample app tabs expose valid complete panels", async ({ page }) => {
  await page.goto("/app/product.html");
  const tabs = page.locator("main .tabs > label");
  const panels = page.locator("main .tabs > div");
  await expect(tabs).toHaveCount(3);
  await expect(panels).toHaveCount(3);
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

test('product panels and finish editor fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/product.html');
  for (const tab of await page.locator('main .tabs > label').all()) {
    await tab.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
  await page.getByRole('radio', { name: /Finishes/ }).check();
  await page.getByRole('button', { name: 'Edit Slate finish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit finish', exact: true });
  await expect(dialog).toHaveCSS('opacity', '1');
  const widths = await dialog.evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }));
  expect(widths.scroll).toBe(widths.client);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Edit Slate finish', exact: true })).toBeFocused();
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

// Blade rendered by PHP through Testbench.
const render = (tag) => execFileSync("php", ["tests/blade.php", tag], { encoding: "utf8" });

// The Blade field rendered with the same props as each Vue field on field.html, in the same order. The Vue demo ends with a combobox and a password reveal, which have no Blade twin.
const fieldErrors = `['tags.1' => ['The selected tag is invalid.'], 'bio' => ['At least 20 characters.', 'Mention where you work.']]`;
const cats = `[['id' => 1, 'name' => 'News'], ['id' => 2, 'name' => 'Sport'], ['id' => 3, 'name' => 'Culture']]`;
const bladeFields = render([
  `<x-ui::field name="email" type="email" required autocomplete="email" hint="We never share it." />`,
  `<x-ui::field name="category_id" type="select" :options="${cats}" :value="['id' => 2, 'name' => 'Sport']" placeholder="Choose one" />`,
  `<x-ui::field name="price" type="number" prepend="£" step="0.01" value="12.50" />`,
  `<x-ui::field name="size" type="radio" :options="['s' => 'Small', 'm' => 'Medium', 'l' => 'Large']" value="m" />`,
  `<x-ui::field name="extras[]" type="checkbox" :options="['gift' => 'Gift wrap', 'card' => 'Card']" :value="['gift']" />`,
  `<x-ui::field name="newsletter" type="switch" label="Send me the newsletter" :value="true" />`,
  `<x-ui::field name="bio" type="textarea" rows="3" value="Hi" />`,
  `<x-ui::field name="published_on" type="date" now />`,
  // a Carbon, as a date cast gives, against the ISO string Inertia makes of it
  `<x-ui::field name="available_from" type="datetime-local" :value="\\Illuminate\\Support\\Carbon::create(2026, 10, 13, 9, 30)" />`,
].map((tag) => tag.replace(" />", ` :errors="${fieldErrors}" />`)).join(""));

// `now` is today in the app's timezone for Blade (UTC under Testbench) and in the browser's for Vue
test.describe(() => { test.use({ timezoneId: "UTC" });
test("field: the Blade and Vue components render the same markup", async ({ page }) => {
  await page.goto("/field.html");
  await page.locator("#vue-demo .combobox").waitFor();
  // a form of its own, so its radios are not one group with the Vue ones of the same name
  await page.locator("main").evaluate((main, html) => main.insertAdjacentHTML("beforeend", `<form id="blade">${html}</form>`), bladeFields);
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
  const [blade, vue] = await Promise.all([shapes("#blade > .field"), shapes("#vue-demo > div > .field")]);
  expect([blade.length, vue.length]).toEqual([9, 11]);
  for (const [i, shape] of blade.entries()) expect(shape, `field ${i + 1}`).toEqual(vue[i]);
  // parity would pass if both left it out, so check each one: every control an error describes is invalid
  for (const [root, count] of [["#blade", 1], ["#vue-demo", 2]]) {
    const described = page.locator(`${root} [aria-describedby*="-error"]:not(fieldset)`);
    await expect(described).toHaveCount(count);
    for (const control of await described.all()) await expect(control).toHaveAttribute("aria-invalid", "true");
  }
});
});

test("field: reveal shows and hides a password, and only the input rings its wrapper", async ({ page }) => {
  await page.goto("/field.html");
  const input = page.locator("#vue-demo").getByLabel("Password", { exact: true });
  const reveal = page.locator("#vue-demo").getByRole("button", { name: "Show password" });
  await input.fill("hunter2");
  await expect(input).toHaveAttribute("type", "password");
  await expect(reveal).toHaveAttribute("aria-pressed", "false");
  await reveal.click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(input).toHaveValue("hunter2");
  await expect(reveal).toHaveAttribute("aria-pressed", "true");
  await reveal.click();
  await expect(input).toHaveAttribute("type", "password");
  // the button rings itself; the wrapper's ring is the input's
  const wrapperRing = () => input.evaluate((el) => getComputedStyle(el.parentElement).outlineStyle);
  await reveal.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(reveal).toBeFocused();
  expect(await wrapperRing()).toBe("none");
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  expect(await wrapperRing()).not.toBe("none");
});

// on its own a combobox is a select's fixed 12rem; in a field it must line up with the inputs around it
test("field: a combobox fills the field like an input", async ({ page }) => {
  await page.goto("/field.html");
  for (const combobox of await page.locator("main .field > .combobox").all()) {
    const [w, field] = await combobox.evaluate((el) => [el.getBoundingClientRect().width, el.parentElement.getBoundingClientRect().width]);
    expect(w).toBe(field);
  }
  expect(await page.locator("main .field > .combobox").count()).toBeGreaterThan(1);
});

test("field: labels, hints and errors reach the control, and models go out as ids", async ({ page }) => {
  await page.goto("/field.html");
  const demo = page.locator("#vue-demo"), output = demo.locator("output");
  await expect(demo.getByLabel("Email")).toHaveAccessibleDescription("We never share it.");
  await expect(demo.getByRole("textbox", { name: "Bio" })).toHaveAccessibleDescription("At least 20 characters. Mention where you work.");
  await expect(demo.getByRole("textbox", { name: "Bio" })).toHaveAttribute("aria-invalid", "true");
  const tags = demo.getByRole("combobox", { name: "Tags", exact: true });
  await expect(tags).toHaveText("Laravel, Tailwind");
  await expect(tags).toHaveAccessibleDescription("Up to two. The selected tag is invalid.");
  await expect(demo.getByRole("group", { name: "Size" })).toBeVisible();
  await expect(demo.getByRole("switch", { name: "Send me the newsletter" })).toBeChecked();

  await demo.getByLabel("Category").selectOption("Culture");
  await expect(output).toContainText('"category_id":3');
  await tags.click();
  await demo.getByRole("option", { name: "Laravel" }).click();
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
  // Inertia's ISO string is trimmed in the model too, so saving sends what the input shows
  await expect(output).toContainText('"available_from":"2026-10-13T09:30"');
});

test("field: inside Inertia's <Form>, reset() sticks when the fields render again", async ({ page }) => {
  await page.goto("/field.html");
  const form = page.locator("#inertia-demo form"), topics = form.getByRole("combobox", { name: "Topics", exact: true });
  await expect(form.getByLabel("Headline")).toHaveValue("Hello");
  await expect(topics).toHaveText("Laravel");
  await form.getByLabel("Headline").fill("Changed");
  await topics.click();
  await form.getByRole("option", { name: "Vue" }).click();
  await page.keyboard.press("Escape");
  await form.getByRole("switch").check();
  const data = () => form.evaluate((f) => [...new FormData(f)].map(([k, v]) => `${k}=${v}`));
  expect(await data()).toEqual(["headline=Changed", "topics[]=1", "topics[]=2", "featured=1"]);

  await form.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(topics).toHaveText("Laravel");
  // the error renders every field again: v-model must not put "Changed" back
  await form.getByRole("button", { name: "Show an error" }).click();
  await expect(form.locator(".error")).toHaveText("An error from setError.");
  await expect(form.getByLabel("Headline")).toHaveValue("Hello");
  await expect(topics).toHaveText("Laravel");
  expect(await data()).toEqual(["headline=Hello", "topics[]=1"]);
});

// reset("topics[]") writes the select and fires no event, so nothing renders until something else does
test("field: inside Inertia's <Form>, resetting one field updates its trigger and max at once", async ({ page }) => {
  await page.goto("/field.html");
  const form = page.locator("#inertia-demo form"), topics = form.getByRole("combobox", { name: "Topics", exact: true });
  await form.getByLabel("Headline").fill("Changed");
  await topics.click();
  await form.getByRole("option", { name: "Vue" }).click();
  // max is 2: the third option is capped
  await expect(form.getByRole("option", { name: "Tailwind" })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");

  await form.getByRole("button", { name: "Reset topics" }).click();
  await expect(topics).toHaveText("Laravel");
  await topics.click();
  await expect(form.getByRole("option", { name: "Tailwind" })).not.toHaveAttribute("aria-disabled");
  await page.keyboard.press("Escape");
  // the other fields keep what was typed
  await expect(form.getByLabel("Headline")).toHaveValue("Changed");
  const data = () => form.evaluate((f) => [...new FormData(f)].map(([k, v]) => `${k}=${v}`));
  expect(await data()).toEqual(["headline=Changed", "topics[]=1"]);
  // and a later render must not bring Vue back
  await form.getByRole("button", { name: "Show an error" }).click();
  await expect(topics).toHaveText("Laravel");
  expect(await data()).toEqual(["headline=Changed", "topics[]=1"]);
});

test("field: inside Inertia's <Form>, options that change keep the selection, and a value that left the options can still be unticked", async ({ page }) => {
  await page.goto("/field.html");
  const form = page.locator("#inertia-demo form"), topics = form.getByRole("combobox", { name: "Topics", exact: true });
  await topics.click();
  await form.getByRole("option", { name: "Vue" }).click();
  await page.keyboard.press("Escape");
  // Laravel leaves the options but stays picked, listed first; Svelte arrives, capped by max until Laravel goes
  await form.getByRole("button", { name: "Other topics" }).click();
  await expect(topics).toHaveText("Laravel, Vue");
  await topics.click();
  await expect(form.locator(".combobox [role=option]")).toHaveText(["Laravel", "Vue", "Tailwind", "Svelte"]);
  await expect(form.getByRole("option", { name: "Svelte" })).toHaveAttribute("aria-disabled", "true");
  await form.getByRole("option", { name: "Laravel" }).click();
  await form.getByRole("option", { name: "Svelte" }).click();
  await page.keyboard.press("Escape");
  await expect(topics).toHaveText("Vue, Svelte");
  const data = () => form.evaluate((f) => [...new FormData(f)].map(([k, v]) => `${k}=${v}`));
  expect(await data()).toEqual(["headline=Hello", "topics[]=2", "topics[]=4"]);
  // a full reset goes back to the starting value, whether or not it is still an option
  await form.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(topics).toHaveText("Laravel");
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
  // a page is a step Back undoes
  await page.goBack();
  await expect(page).not.toHaveURL(/basic_page/);
  await expect(dt.getByRole("status")).toHaveText("Showing 1–5 of 7");

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

  await dt.locator(".controls").getByRole("combobox", { name: "Size", exact: true }).click();
  await dt.getByRole("option", { name: "L", exact: true }).click();
  await expect(page).toHaveURL(/products_size%5B%5D=L/);
  await expect(bodyRows(dt)).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dt.locator(".controls").getByRole("combobox", { name: "Size", exact: true })).toContainText("L");
});

test("datatable: a date range works from either end, turns round when reversed and clears", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Products");
  await dt.getByLabel("Added from").fill("2026-02-01");
  await expect(page).toHaveURL(/products_added_from=2026-02-01/);
  await expect(bodyRows(dt)).toHaveCount(9);
  await dt.getByLabel("Added to").fill("2026-01-01");
  await expect(dt.getByLabel("Added from")).toHaveValue("2026-01-01");
  await expect(dt.getByLabel("Added to")).toHaveValue("2026-02-01");
  await expect(bodyRows(dt)).toHaveCount(3);
  await dt.getByRole("button", { name: "Clear Added" }).click();
  await expect(page).not.toHaveURL(/products_added/);
  await expect(dt.getByLabel("Added from")).toHaveValue("");
  await expect(bodyRows(dt)).toHaveCount(10);
});

test("datatable: a date preset fills in both dates, and the select names it only while they match", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 2, 25, 10));
  await page.goto("/datatable.html");
  const dt = datatable(page, "Products");
  const preset = dt.getByRole("combobox", { name: "Added preset" });
  await expect(preset.locator("option:checked")).toHaveText("Any time");
  await preset.selectOption("Last 30 days");
  await expect(page).toHaveURL(/products_added_from=2026-02-24&products_added_to=2026-03-25/);
  await expect(dt.getByLabel("Added from")).toHaveValue("2026-02-24");
  await expect(bodyRows(dt)).toHaveCount(3);
  await dt.getByLabel("Added from").fill("2026-02-01");
  await expect(preset).toHaveValue("");
  await expect(preset.locator("option:checked")).toHaveText("Custom");
  await page.goBack();
  await expect(preset).toHaveValue("Last 30 days");
  await dt.getByRole("button", { name: "Clear Added" }).click();
  await expect(preset.locator("option:checked")).toHaveText("Any time");
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
  // another table's sort changes the URL but not this list, so the selection stays
  await datatable(page, "Team members").getByRole("button", { name: "Email" }).click();
  await expect(page).toHaveURL(/basic_sort=email/);
  await expect(dt.locator(".bulk p")).toHaveText("12 selected");
  // a query cannot leave one row out, so unticking one goes back to the page's ids, less that one
  const header = dt.getByRole("checkbox", { name: "Select every Products under review row on this page" });
  await dt.locator("tbody input").first().uncheck();
  await expect(dt.locator(".bulk p")).toHaveText("9 selected");
  await expect(output).toContainText('"mode":"ids"');
  expect(await header.evaluate((e) => e.indeterminate)).toBe(true);
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
  // the last data column cannot go: rows with nothing in them cannot be told apart
  const group = datatable(page, "Team members").getByRole("group", { name: "Team members columns" });
  await datatable(page, "Team members").getByRole("button", { name: "Columns" }).click();
  await group.getByRole("checkbox", { name: "Role" }).uncheck();
  await expect(group.getByRole("checkbox", { name: "Name" })).toBeDisabled();
});

test("file input: choose, list, remove, drop, reset, and accept filters dropped files", async ({ page }) => {
  const warnings = [];
  page.on("console", (m) => ["warning", "error"].includes(m.type()) && warnings.push(m.text()));
  // count revoked preview URLs, so a removed image is known to free its blob
  await page.addInitScript(() => {
    const revoke = URL.revokeObjectURL;
    window.revoked = [];
    URL.revokeObjectURL = (url) => (window.revoked.push(url), revoke(url));
  });
  await page.goto("/file.html");
  const zone = page.locator("#vue-demo .dropzone").first(), input = page.locator("#photos"), output = page.locator("#vue-demo output").first();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const file = (name) => ({ name, mimeType: "image/png", buffer: png });

  // multiple: a second pick adds to the list, and the native input holds every file
  await input.setInputFiles([file("a.png"), file("b.png")]);
  await input.setInputFiles([file("c.png")]);
  await expect(output).toHaveText("v-model: [a.png, b.png, c.png]");
  await expect(zone.locator("li")).toHaveCount(3);
  expect(await input.evaluate((el) => [...el.files].map((f) => f.name))).toEqual(["a.png", "b.png", "c.png"]);
  const src = await zone.locator("li img").nth(1).getAttribute("src");
  expect(src).toMatch(/^blob:/);

  // remove: the file goes, its preview is revoked, and focus moves to the next remove button
  await zone.getByRole("button", { name: "Remove b.png" }).click();
  await expect(output).toHaveText("v-model: [a.png, c.png]");
  expect(await page.evaluate(() => window.revoked)).toEqual([src]);
  await expect(zone.getByRole("button", { name: "Remove c.png" })).toBeFocused();
  expect(await input.evaluate((el) => el.files.length)).toBe(2);

  // drop: an image is added, a PDF is refused by accept="image/*" and named in an alert
  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "d.png", { type: "image/png" }));
    dt.items.add(new File(["x"], "e.pdf", { type: "application/pdf" }));
    return dt;
  });
  await zone.dispatchEvent("dragover", { dataTransfer });
  await expect(zone).toHaveClass(/dragging/);
  await zone.locator("label").dispatchEvent("drop", { dataTransfer });
  await expect(zone).not.toHaveClass(/dragging/);
  await expect(output).toHaveText("v-model: [a.png, c.png, d.png]");
  await expect(zone.getByRole("alert")).toHaveText("Not an accepted file type: e.pdf.");

  // single: a new file replaces the old one
  const contract = page.locator("#contract");
  await contract.setInputFiles([{ name: "one.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") }]);
  await contract.setInputFiles([{ name: "two.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") }]);
  await expect(page.locator("#vue-demo output").nth(1)).toHaveText("v-model: two.pdf");

  // a native form reset empties the list and v-model along with the input
  await page.locator("#vue-demo").getByRole("button", { name: "Reset", exact: true }).click();
  await expect(output).toHaveText("v-model: []");
  await expect(zone.locator("li")).toHaveCount(0);
  await expect(zone.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("#vue-demo output").nth(1)).toHaveText("v-model: null");
  expect(await input.evaluate((el) => el.files.length)).toBe(0);

  // disabled: a drop does nothing
  const archived = page.locator("#vue-demo .dropzone").nth(2);
  await archived.locator("label").dispatchEvent("drop", { dataTransfer });
  await expect(archived.locator("li")).toHaveCount(0);
  expect(warnings).toEqual([]);
});

// Combobox: keyboard, selection, resets and the server, on the examples of combobox.html.
const combobox = (page, section, n = 0) => page.locator(`#${section} .combobox`).nth(n);
const submitted = (box) => box.locator("select").evaluate((s) => (s.disabled ? [] : [...s.selectedOptions].map((o) => o.value).filter(Boolean)));
const activeOption = (control) => control.evaluate((el) => document.getElementById(el.getAttribute("aria-activedescendant"))?.textContent ?? null);

test("combobox: one from a short list works from the keyboard on the trigger", async ({ page }) => {
  await page.goto("/combobox.html");
  const box = combobox(page, "single"), trigger = box.getByRole("combobox", { name: "Status", exact: true }), list = box.getByRole("listbox");
  await expect(trigger).toHaveText("In review");
  await expect(trigger).toHaveAttribute("aria-required", "true");
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(list).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toBeFocused();
  await expect.poll(() => activeOption(trigger)).toBe("In review");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeOption(trigger)).toBe("Published");
  await page.keyboard.press("End");
  await expect.poll(() => activeOption(trigger)).toBe("Archived");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeOption(trigger)).toBe("Archived");
  await page.keyboard.press("Home");
  await expect.poll(() => activeOption(trigger)).toBe("Draft");
  await page.keyboard.press("p");
  await expect.poll(() => activeOption(trigger)).toBe("Published");
  await page.keyboard.press("Enter");
  await expect(list).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText("Published");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(await submitted(box)).toEqual(["3"]);
  await expect(page.locator("#single output").first()).toHaveText("v-model: 3");

  // Escape closes without a change; Space opens and picks
  await page.keyboard.press("ArrowUp");
  await expect(list).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(trigger).toHaveText("Published");
  await page.keyboard.press("Space");
  await expect(list).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(list).toBeHidden();
  await expect(trigger).toHaveText("Archived");
  // a click picks too
  await trigger.click();
  await list.getByRole("option", { name: "Draft" }).click();
  await expect(list).toBeHidden();
  await expect(trigger).toHaveText("Draft");

  // disabled: cannot open, submits nothing
  await expect(combobox(page, "single", 1).getByRole("combobox")).toBeDisabled();
  expect(await submitted(combobox(page, "single", 1))).toEqual([]);
});

test("combobox: a long list searches, and the search box drives the listbox", async ({ page }) => {
  await page.goto("/combobox.html");
  const box = combobox(page, "long"), trigger = box.getByRole("combobox", { name: "Assignee", exact: true });
  await trigger.click();
  const search = box.getByRole("combobox", { name: "Search Assignee" });
  await expect(search).toBeFocused();
  await expect(box.getByRole("option")).toHaveCount(15);
  await page.keyboard.type("ja");
  await expect(box.getByRole("option")).toHaveText(["Jack Wilson"]);
  await expect.poll(() => activeOption(search)).toBe("Jack Wilson");
  await page.keyboard.press("Enter");
  await expect(search).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText("Jack Wilson");
  expect(await submitted(box)).toEqual(["10"]);

  // the query starts empty again and the highlight on the value; arrows move, Escape leaves the value
  await page.keyboard.press("Enter");
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => activeOption(search)).toBe("Kate Murphy");
  await page.keyboard.type("zz");
  await expect(box.getByRole("status")).toHaveText("No results");
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText("Jack Wilson");
  // Tab out closes it
  await page.keyboard.press("Enter");
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search).toBeHidden();
});

test("combobox: multiple with search toggles options and stays open", async ({ page }) => {
  await page.goto("/combobox.html");
  const box = combobox(page, "multiple-search"), trigger = box.getByRole("combobox", { name: "Tags", exact: true });
  await expect(trigger).toHaveText("Laravel, Tailwind");
  await expect(trigger).toHaveAttribute("data-count", "2");
  await trigger.click();
  const search = box.getByRole("combobox", { name: "Search Tags" }), list = box.getByRole("listbox");
  await expect(list).toHaveAttribute("aria-multiselectable", "true");
  await expect(search).toBeFocused();
  await page.keyboard.type("css");
  await page.keyboard.press("Enter");
  await expect(list.getByRole("option", { name: "CSS" })).toHaveAttribute("aria-selected", "true");
  await expect(search).toBeFocused();
  await expect(trigger).toHaveText("Laravel, Tailwind, CSS");
  await page.keyboard.press("Enter");
  await expect(list.getByRole("option", { name: "CSS" })).toHaveAttribute("aria-selected", "false");
  await search.fill("");
  await list.getByRole("option", { name: "Vue" }).click();
  await expect(list).toBeVisible();
  await expect(search).toBeFocused();
  expect(await submitted(box)).toEqual(["1", "3", "2"]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  // the clear button sits beside the trigger and empties it
  await box.getByRole("button", { name: "Clear Tags" }).click();
  await expect(trigger).toHaveText("");
  await expect(trigger).toBeFocused();
  expect(await submitted(box)).toEqual([]);
});

test("combobox: multiple without search is a select-only listbox that stays open, with max", async ({ page }) => {
  await page.goto("/combobox.html");
  const box = combobox(page, "multiple", 1), trigger = box.getByRole("combobox", { name: "Delivery days", exact: true });
  const list = box.getByRole("listbox"), option = (name) => list.getByRole("option", { name });
  await expect(trigger).toHaveAttribute("aria-required", "true");
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(list).toHaveAttribute("aria-multiselectable", "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(list).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(option("Friday")).toHaveAttribute("aria-disabled", "true");
  // a click toggles and leaves the panel open
  await option("Wednesday").click();
  await expect(option("Wednesday")).toHaveAttribute("aria-selected", "false");
  await expect(option("Friday")).not.toHaveAttribute("aria-disabled");
  await option("Wednesday").click();
  await expect(list).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText("Monday, Wednesday");
  expect(await submitted(box)).toEqual(["1", "2"]);
  expect(await box.locator("select").getAttribute("name")).toBe("days[]");
});

test("combobox: a native form reset and Inertia's reset() put the starting values back", async ({ page }) => {
  await page.goto("/combobox.html");
  const form = page.locator("#native form"), owner = page.getByRole("combobox", { name: "Owner", exact: true }), status = form.getByRole("combobox", { name: "Status", exact: true }), sizes = form.getByRole("combobox", { name: "Sizes", exact: true });
  const data = () => form.evaluate((f) => [...new FormData(f)].map(([k, v]) => `${k}=${v}`));
  // Owner sits outside the form and joins it with form="…"
  expect(await data()).toEqual(["status=1", "sizes[]=1", "sizes[]=2", "tags[]=3", "owner_id=2"]);
  await owner.click();
  await expect(page.getByRole("combobox", { name: "Search Owner" })).toBeFocused();
  await page.keyboard.type("mia");
  await page.keyboard.press("Enter");
  await status.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await sizes.click();
  await form.getByRole("option", { name: "Small" }).click();
  await form.getByRole("option", { name: "Large", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(status).toHaveText("Archived");
  await expect(sizes).toHaveText("Medium, Large");
  expect(await data()).toEqual(["status=4", "sizes[]=2", "sizes[]=3", "tags[]=3", "owner_id=13"]);
  await form.getByRole("button", { name: "Reset" }).click();
  await expect(status).toHaveText("Draft");
  await expect(sizes).toHaveText("Small, Medium");
  await expect(owner).toHaveText("Ben Carter");
  expect(await data()).toEqual(["status=1", "sizes[]=1", "sizes[]=2", "tags[]=3", "owner_id=2"]);
  // and it still changes afterwards
  await status.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("In review");

  const inertia = page.locator("#inertia form"), assignee = inertia.getByRole("combobox", { name: "Assignee", exact: true }), tags = inertia.getByRole("combobox", { name: "Tags", exact: true });
  await expect(inertia.locator("output")).toHaveText("Unchanged");
  await assignee.click();
  await expect(inertia.getByRole("combobox", { name: "Search Assignee" })).toBeFocused();
  await page.keyboard.type("grace");
  await page.keyboard.press("Enter");
  await tags.click();
  await expect(inertia.getByRole("combobox", { name: "Search Tags" })).toBeFocused();
  await page.keyboard.type("vue");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(assignee).toHaveText("Grace Lee");
  await expect(tags).toHaveText("Laravel, Vue");
  await expect(inertia.locator("output")).toHaveText("Changed");
  // reset("tags[]") fires no event: the trigger still follows at once, and the other field keeps its change
  await inertia.getByRole("button", { name: "Reset tags" }).click();
  await expect(tags).toHaveText("Laravel");
  await expect(assignee).toHaveText("Grace Lee");
  await inertia.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(assignee).toHaveText("Chloe Evans");
  await expect(tags).toHaveText("Laravel");
  await expect(inertia.locator("output")).toHaveText("Unchanged");
});

test("combobox: src and create talk to the server with the XSRF token, drop stale answers and show errors", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "XSRF-TOKEN", value: "tok%3D", url: baseURL }]);
  const tokens = new Set();
  await page.route("**/api/suppliers**", async (route) => {
    const req = route.request(), q = new URL(req.url()).searchParams.get("q");
    tokens.add(req.headers()["x-xsrf-token"]);
    if (req.method() === "POST") {
      const { label } = req.postDataJSON();
      return label === "ab"
        ? route.fulfill({ status: 422, json: { message: "The label has already been taken.", errors: { label: ["The label has already been taken."] } } })
        : route.fulfill({ status: 201, json: { value: 77, label } });
    }
    if (q === "err") return route.fulfill({ status: 500, body: "" });
    if (q === "a") await new Promise((r) => setTimeout(r, 800));
    const rows = { "": [{ value: 1, label: "Alpha" }, { value: 2, label: "Beta" }], a: [{ value: 9, label: "Stale" }], ab: [{ value: 3, label: "Abbey Supplies" }] };
    route.fulfill({ json: rows[q] ?? [] });
  });
  await page.goto("/combobox.html");
  const box = combobox(page, "urls"), trigger = box.getByRole("combobox", { name: "Supplier", exact: true }), options = box.getByRole("option");
  await trigger.click();
  // the empty query asks the server what to offer first
  await expect(options).toHaveText(["Alpha", "Beta"]);
  const search = box.getByRole("combobox", { name: "Search Supplier" });
  await page.keyboard.type("a");
  await expect(box.getByRole("status")).toHaveText("Searching…");
  await page.waitForTimeout(400);
  await page.keyboard.type("b");
  await expect(options).toHaveText(["Abbey Supplies", "Add “ab”"]);
  await page.waitForTimeout(800);
  await expect(options).toHaveText(["Abbey Supplies", "Add “ab”"]);

  // a 422 shows its message in the panel
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(box.getByRole("status")).toHaveText("The label has already been taken.");
  await expect(search).toBeVisible();
  // any other failure says so
  await search.fill("err");
  await expect(box.getByRole("status")).toHaveText("Could not load results.");
  // a created record is selected
  await search.fill("New Co");
  await expect(options).toHaveText(["Add “New Co”"]);
  await page.keyboard.press("Enter");
  await expect(search).toBeHidden();
  await expect(trigger).toHaveText("New Co");
  expect(await submitted(box)).toEqual(["77"]);
  expect([...tokens]).toEqual(["tok="]);
});

test("combobox: create sends one request for a double Enter, and none once multiple is at max", async ({ page }) => {
  let posts = 0;
  await page.route("**/api/suppliers**", async (route) => {
    if (route.request().method() !== "POST") return route.fulfill({ json: [] });
    posts++;
    await new Promise((r) => setTimeout(r, 300));
    route.fulfill({ status: 201, json: { value: 77, label: "New Co" } });
  });
  await page.goto("/combobox.html");
  const box = combobox(page, "urls"), trigger = box.getByRole("combobox", { name: "Supplier", exact: true });
  await trigger.click();
  await expect(box.getByRole("combobox", { name: "Search Supplier" })).toBeFocused();
  await page.keyboard.type("New Co");
  await expect(box.getByRole("option")).toHaveText(["Add “New Co”"]);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("New Co");
  expect(posts).toBe(1);

  // Tags in "Adding one" takes three; at three, Add is disabled and Enter creates nothing
  const tags = combobox(page, "create"), search = tags.getByRole("combobox", { name: "Search Tags" });
  await tags.getByRole("combobox", { name: "Tags", exact: true }).click();
  for (const name of ["Vue", "CSS"]) {
    await search.fill(name);
    await tags.getByRole("option", { name, exact: true }).click();
  }
  await search.fill("Zebra");
  const add = tags.getByRole("option", { name: "Add “Zebra”" });
  await expect(add).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  await expect(tags.getByRole("status")).not.toHaveText("Adding…");
  await page.waitForTimeout(600);
  // nothing was created: the search still offers to add it
  await expect(tags.getByRole("option")).toHaveText(["Add “Zebra”"]);
  await page.keyboard.press("Escape");
  await expect(tags.getByRole("combobox", { name: "Tags", exact: true })).toHaveText("Laravel, Vue, CSS");
});
