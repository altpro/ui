// Small engine matrix for the native HTML and CSS features altpro/ui depends on.
// Chromium runs this alongside the detailed accessibility suite; Firefox and
// WebKit run this file only so browser-specific pixel checks stay meaningful.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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

// .inverse is a style container query on the inherited --scheme: it flips relative to the nearest region, at any depth
for (const colorScheme of ["light", "dark"]) test(`.inverse flips the scheme around it, nested and at the root, in ${colorScheme}`, async ({ page }) => {
  await page.emulateMedia({ colorScheme });
  await page.goto("/theme.html");
  const flipped = colorScheme === "light" ? "dark" : "light";
  const regions = await page.evaluate(() => {
    document.querySelector("main").insertAdjacentHTML("beforeend", '<div class="inverse" id="flip"><div class="inverse" id="back">x</div></div>');
    const read = (el) => ({ scheme: getComputedStyle(el).colorScheme, bg: getComputedStyle(el).backgroundColor });
    const dark = document.querySelector("main .dark.panel"), light = dark.querySelector(".light"), inv = light.querySelector(".inverse"), again = inv.querySelector(".inverse");
    return { dark: read(dark), light: read(light), inv: read(inv), again: read(again), body: read(document.body), flip: read(document.getElementById("flip")), back: read(document.getElementById("back")) };
  });
  expect(regions.inv).toEqual(regions.dark);
  expect(regions.again).toEqual(regions.light);
  expect(regions.flip).toEqual(regions[flipped]);
  expect(regions.back.scheme).toBe(colorScheme);
  expect(regions.back.bg).toBe(regions[colorScheme].bg);
});

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
// the exit fade keeps the dialog in the top layer through `overlay`, which only Chromium transitions;
// elsewhere it must vanish at once rather than fade out of place
test("dialog: a closing modal or drawer fades where it was, or is gone", async ({ page }) => {
  await page.goto("/dialog.html");
  for (const id of ["d-basic", "d-drawer"]) {
    const r = await page.evaluate(async (id) => {
      const d = document.getElementById(id), box = () => { const b = d.getBoundingClientRect(); return Math.round(b.y + b.height / 2); }; // the centre: the fade scales the box
      d.style.transitionDuration = "1s";
      d.showModal();
      await new Promise((r) => setTimeout(r, 1200));
      const open = box();
      d.close();
      await new Promise((r) => setTimeout(r, 200));
      return { open, mid: getComputedStyle(d).display === "none" ? open : box() };
    }, id);
    expect(Math.abs(r.mid - r.open), id).toBeLessThanOrEqual(1);
  }
});

// a radio matches :indeterminate while its group has nothing checked, which is not a choice made
test("check: an unselected radio group draws empty, and an indeterminate checkbox still fills", async ({ page }) => {
  await page.goto("/check.html");
  const fills = await page.evaluate(() => {
    const box = (html) => {
      const label = document.createElement("label");
      label.className = html.includes("radio") ? "radio" : "checkbox";
      label.innerHTML = html;
      document.querySelector("main").append(label);
      return label.firstChild;
    };
    const blank = box('<input type="radio" name="none-chosen">');
    const mixed = box('<input type="checkbox">');
    mixed.indeterminate = true;
    const bg = (el) => getComputedStyle(el).backgroundColor;
    return { blank: bg(blank), mixed: bg(mixed), page: bg(box('<input type="checkbox">')) };
  });
  expect(fills.blank).toBe(fills.page);
  expect(fills.mixed).not.toBe(fills.page);
});

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

for (const radius of ["0", "9999px"]) {
  test(`the sample app fits a mobile viewport at radius ${radius}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/product.html");
    await page.evaluate((value) => document.documentElement.style.setProperty("--radius", value), radius);
    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(widths.document).toBe(widths.viewport);
  });
}

test('product page and finish editor fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/product.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
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
  `<x-ui::field name="newsletter" type="switch" label="Send me the newsletter" :value="1" />`,
  `<x-ui::field name="bio" type="textarea" rows="3" value="Hi" />`,
  `<x-ui::field name="published_on" type="date" now />`,
  // a Carbon, as a date cast gives, against the ISO string Inertia makes of it
  `<x-ui::field name="available_from" type="datetime-local" :value="\\Illuminate\\Support\\Carbon::create(2026, 10, 13, 9, 30)" />`,
  `<x-ui::field name="attachments" type="file" multiple />`,
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
  expect([blade.length, vue.length]).toEqual([10, 12]);
  for (const [i, shape] of blade.entries()) expect(shape, `field ${i + 1}`).toEqual(vue[i]);
  // parity would pass if both left it out, so check each one: every control an error describes is invalid
  for (const [root, count] of [["#blade", 1], ["#vue-demo", 2]]) {
    const described = page.locator(`${root} [aria-describedby*="-error"]:not(fieldset)`);
    await expect(described).toHaveCount(count);
    for (const control of await described.all()) await expect(control).toHaveAttribute("aria-invalid", "true");
  }
  // several files under one name need [], or PHP keeps the last
  for (const root of ["#blade", "#vue-demo"]) await expect(page.locator(`${root} input[type=file]`)).toHaveAttribute("name", "attachments[]");
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

// a reveal's wrapper is a div, which passes no clicks on, so the input itself has to cover the box. Sampled 2px in from
// each edge, past the 1px border; beside the button only the strip the button's negative margin leaves stays the wrapper's.
const hitsInput = (input) => input.evaluate((el) => {
  el.scrollIntoView({ block: "center" });
  const box = el.parentElement.getBoundingClientRect(), button = el.parentElement.querySelector("button").getBoundingClientRect();
  const y = box.top + box.height / 2;
  return Object.fromEntries(Object.entries({
    left: [box.left + 2, y], top: [box.left + box.width / 2, box.top + 2], bottom: [box.left + box.width / 2, box.bottom - 2],
    corner: [box.left + 8, box.top + 2], beside: [button.left - 2, y],
  }).map(([name, [px, py]]) => [name, document.elementFromPoint(px, py) === el]));
});
const everywhere = { left: true, top: true, bottom: true, corner: true, beside: true };

for (const size of ["", "xs", "sm", "lg", "xl"]) test(`field: a click anywhere in a reveal box lands in the input${size && `, at ${size}`}`, async ({ page }) => {
  await page.goto("/field.html");
  const input = page.locator("#vue-demo").getByLabel("Password", { exact: true });
  await input.evaluate((el, size) => size && el.parentElement.classList.add(size), size);
  expect(await hitsInput(input)).toEqual(everywhere);
  const box = await input.locator("..").boundingBox();
  // just inside the corner: nearer than this is the wrapper's curved border
  await page.mouse.click(box.x + 4, box.y + 4);
  await expect(input).toBeFocused();
  // the text stays where every other input keeps it
  const inset = await input.evaluate((el) => {
    const box = el.parentElement, range = parseFloat(getComputedStyle(box).getPropertyValue("--input-px")) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const text = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingInlineStart);
    return [text - box.getBoundingClientRect().left - box.clientLeft, range];
  });
  expect(inset[0]).toBeCloseTo(inset[1], 1);
});

test("field: a reveal with a prepend keeps its text inset, and the input still takes the height", async ({ page }) => {
  await page.goto("/field.html");
  const input = page.getByLabel("PIN"), wrapper = input.locator("..");
  const [offset, px] = await wrapper.evaluate((el) => [el.querySelector("span").getBoundingClientRect().left - el.getBoundingClientRect().left - el.clientLeft, parseFloat(getComputedStyle(el).paddingInlineStart)]);
  expect(offset).toBeCloseTo(px, 1);
  expect(px).toBeGreaterThan(0);
  const { top, bottom, beside } = await hitsInput(input);
  expect({ top, bottom, beside }).toEqual({ top: true, bottom: true, beside: true });
});

// the sign-in pages have no Vue: the Blade field, with the skill's own guest.js wrapping it in the same div.input
test("field: the skill's guest.js reveal lands clicks in the input too", async ({ page }) => {
  await page.goto("/field.html");
  const guest = readFileSync("resources/boost/skills/altpro-ui/references/app-shell.md", "utf8").match(/```js\n\/\/ resources\/js\/guest\.js\n([\s\S]*?)```/)[1];
  await page.evaluate(([field, guest]) => {
    document.querySelector("main").insertAdjacentHTML("afterbegin", `<div id="guest">${field}</div><template id="reveal"><button type="button" class="btn ghost sm -me-2 px-2" aria-label="Show password" aria-pressed="false"><svg class="size-4"></svg></button></template>`);
    new Function(guest.replace("document.querySelectorAll(\"input[type=password]\")", "document.querySelectorAll(\"#guest input[type=password]\")"))();
  }, [render(`<x-ui::field name="sign_in_password" label="Sign-in password" type="password" />`), guest]);
  const input = page.getByLabel("Sign-in password");
  await expect(input.locator("..")).toHaveClass("input");
  expect(await hitsInput(input)).toEqual(everywhere);
});

test.describe("field: a revealed password hides again", () => {
  const demo = (page) => page.locator("#reveal-demo");
  const expectHidden = async (input, button) => {
    await expect(input).toHaveAttribute("type", "password");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  };

  // the case apps hit: nothing typed, so Inertia's reset changes nothing and fires no reset event
  test("when its dialog closes, with nothing typed", async ({ page }) => {
    await page.goto("/field.html");
    const open = demo(page).getByRole("button", { name: "Confirm with a password" }), dialog = demo(page).getByRole("dialog");
    const input = dialog.getByLabel("Current password"), eye = dialog.getByRole("button", { name: "Show password" });
    await open.click();
    await eye.click();
    await expect(input).toHaveAttribute("type", "text");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await open.click();
    await expectHidden(input, eye);
  });

  test("when its dialog closes, with a password typed", async ({ page }) => {
    await page.goto("/field.html");
    const open = demo(page).getByRole("button", { name: "Confirm with a password" }), dialog = demo(page).getByRole("dialog");
    const input = dialog.getByLabel("Current password"), eye = dialog.getByRole("button", { name: "Show password" });
    await open.click();
    await input.fill("hunter2");
    await eye.click();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await open.click();
    await expect(input).toHaveValue("");
    await expectHidden(input, eye);
  });

  test("when Inertia resets that one field and fires no event", async ({ page }) => {
    await page.goto("/field.html");
    const dialog = demo(page).getByRole("dialog");
    await demo(page).getByRole("button", { name: "Confirm with a password" }).click();
    const input = dialog.getByLabel("Current password"), eye = dialog.getByRole("button", { name: "Show password" });
    await input.fill("hunter2");
    await eye.click();
    await dialog.getByRole("button", { name: "Wrong password" }).click();
    await expect(dialog.locator(".error")).toHaveText("That password is wrong.");
    await expect(input).toHaveValue("");
    await expectHidden(input, eye);
  });

  test("when useForm resets the model, which fires no native reset", async ({ page }) => {
    await page.goto("/field.html");
    const input = demo(page).getByLabel("With useForm"), eye = input.locator("..").getByRole("button", { name: "Show password" });
    await input.fill("hunter2");
    await eye.click();
    await expect(input).toHaveAttribute("type", "text");
    await demo(page).getByRole("button", { name: "Reset with useForm" }).click();
    await expect(input).toHaveValue("");
    await expectHidden(input, eye);
  });

  test("on a native form reset", async ({ page }) => {
    await page.goto("/field.html");
    const input = page.getByLabel("PIN"), eye = input.locator("..").getByRole("button", { name: "Show password" });
    await input.fill("1234");
    await eye.click();
    await expect(input).toHaveAttribute("type", "text");
    await demo(page).getByRole("button", { name: "Native reset" }).click();
    await expectHidden(input, eye);
  });

  test("but not on blur, or when the user clears it to retype", async ({ page }) => {
    await page.goto("/field.html");
    const input = demo(page).getByLabel("With useForm"), eye = input.locator("..").getByRole("button", { name: "Show password" });
    await input.fill("hunter2");
    await eye.click();
    await input.focus();
    await page.locator("h1").click();
    await expect(input).toHaveAttribute("type", "text");
    await input.focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Delete");
    await expect(input).toHaveValue("");
    await expect(input).toHaveAttribute("type", "text");
    await expect(eye).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("hunter3");
    await expect(input).toHaveAttribute("type", "text");
    await expect(input).toHaveValue("hunter3");
  });
});

// a heavier active tab is wider, and moved every tab after it between pages
test("tabs: the active tab does not move the tabs after it", async ({ page }) => {
  await page.goto("/tabs.html");
  const lefts = await page.evaluate(() => {
    const labels = ["Profile", "Security", "Sessions", "Appearance"];
    return labels.map((_, active) => {
      const nav = document.createElement("nav");
      nav.className = "tabs";
      nav.innerHTML = labels.map((label, i) => `<a href="#"${i === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");
      document.querySelector("main").prepend(nav);
      return [...nav.children].map((a) => a.getBoundingClientRect().left).join();
    });
  });
  expect(new Set(lefts).size).toBe(1);
});

// a dialog scrolls, so it clips: the bubble has to fit inside it, and a centred one on a host at the edge cannot
test("tooltip: data-tooltip-align keeps a long bubble inside a dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/tooltip.html");
  const bubbles = await page.evaluate(() => {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog";
    const long = "Copy the setup key to your clipboard";
    dialog.innerHTML = `<div class="mt-12 flex justify-between"><button class="btn sm" data-tooltip="${long}" data-tooltip-align="start">a</button><button class="btn sm" data-tooltip="${long}" data-tooltip-align="end">b</button></div>`;
    document.body.append(dialog);
    dialog.showModal();
    const box = dialog.getBoundingClientRect();
    return [...dialog.querySelectorAll("button")].map((host) => {
      const bubble = getComputedStyle(host, "::after"), rect = host.getBoundingClientRect(), width = parseFloat(bubble.width);
      const left = host.dataset.tooltipAlign === "start" ? rect.left + parseFloat(bubble.left) : rect.right - parseFloat(bubble.right) - width;
      return { inside: left >= box.left && left + width <= box.right, tail: getComputedStyle(host, "::before").translate };
    });
  });
  expect(bubbles.map((b) => b.inside)).toEqual([true, true]);
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
  // the model is 1, an uncast column, which ticks the box as Blade's @checked does
  await expect(demo.getByRole("switch", { name: "Send me the newsletter" })).toBeChecked();
  await demo.getByRole("switch", { name: "Send me the newsletter" }).uncheck();
  await expect(output).toContainText('"newsletter":false');

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

test("datatable: srOnlyLabel names a header for screen readers and shows nothing", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  const header = dt.getByRole("columnheader", { name: "Open", exact: true });
  await expect(header).toHaveCount(1);
  // the label is in the accessibility tree but takes up no room on screen
  const box = await header.locator(".sr-only").boundingBox();
  expect(box.width * box.height).toBeLessThanOrEqual(1);
  await expect(dt.getByRole("cell").getByRole("link", { name: "Open Ada Lovelace" })).toHaveCount(1);
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
  await expect(dt.locator(".controls").getByRole("combobox", { name: "Brand", exact: true })).toHaveText("All");
});

test("datatable: a date range's clear button waits for a range, holds its place and keeps focus", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Recent products"), from = dt.getByLabel("Added from"), clear = dt.getByRole("button", { name: "Clear dates", exact: true });
  // the default is in force: nothing to clear
  await expect(from).toHaveValue("2026-02-01");
  await expect(clear).toHaveAttribute("aria-disabled", "true");
  await expect(clear).toHaveText("Clear dates");
  const left = () => clear.evaluate((el) => el.getBoundingClientRect().left);
  const place = await left();

  await from.fill("2026-03-01");
  await expect(clear).not.toHaveAttribute("aria-disabled");
  expect(await left()).toBeCloseTo(place, 0);

  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(from).toHaveValue("2026-02-01");
  await expect(clear).toHaveAttribute("aria-disabled", "true");
  await expect(clear).toBeFocused();
  // pressed again with nothing to clear, it does nothing
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/recent_added/);
});

test("datatable: a multiple filter reads the numbered URL a Laravel page comes back with, and lets go of it", async ({ page }) => {
  await page.goto("/datatable.html?products_size%5B0%5D=L&products_size%5B1%5D=M");
  const dt = datatable(page, "Products"), size = dt.locator(".controls").getByRole("combobox", { name: "Size", exact: true });
  await expect(size).toContainText("L, M");
  await dt.getByRole("button", { name: "Clear Size" }).click();
  await expect(page).not.toHaveURL(/products_size/);
  await expect(size).toHaveText("All");
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

test("datatable: Clear filters clears a default that matches nothing, rather than put it back", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Guests");
  await expect(dt.locator("tbody td[colspan]")).toContainText("No guests on the team.");
  await dt.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/guests_role=(&|$)/);
  await expect(dt.getByRole("combobox", { name: "Role" })).toHaveValue("");
  await expect(dt.getByRole("status")).toHaveText("Showing 1–7 of 7");
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
  // a matching selection once emitted a new object on every parent render, and Vue gave up after 100 rounds
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  // v-model:selection works both ways: the page sets it to null, and the ticks go
  await dt.getByRole("button", { name: "Discontinue" }).click();
  await expect(output).toHaveText("1 discontinued.");
  await expect(dt.locator("tbody input:checked")).toHaveCount(0);
  await expect(dt.locator(".bulk")).toHaveCount(0);
  expect(errors).toEqual([]);
});

// A button that disables or removes itself would drop focus to the body. Keys, not clicks: a click in Safari focuses no button.
test("datatable: focus stays in the table when the button pressed goes away", async ({ page }) => {
  await page.goto("/datatable.html");
  const press = async (locator) => {
    await locator.focus();
    await page.keyboard.press("Enter");
  };

  // Next on the last page but one disables itself: the current page takes focus, and Previous does the same back
  const nav = datatable(page, "Team members").getByRole("navigation", { name: "Team members pagination" });
  await press(nav.getByRole("button", { name: "Next page" }));
  await expect(nav.getByRole("button", { name: "Next page" })).toBeDisabled();
  await expect(nav.getByRole("button", { name: "2" })).toBeFocused();
  await press(nav.getByRole("button", { name: "Previous page" }));
  await expect(nav.getByRole("button", { name: "1" })).toBeFocused();

  // Clear filters sits in the empty row it removes: the search box it emptied takes focus
  const products = datatable(page, "Products");
  await products.getByRole("searchbox").fill("zzzz");
  await press(products.getByRole("button", { name: "Clear filters" }));
  await expect(products.getByRole("searchbox")).toBeFocused();
  await expect(products.getByRole("searchbox")).toHaveValue("");

  // the offer goes once taken: the count takes focus; the bar goes with Clear: the header box does
  const dt = datatable(page, "Products under review");
  const header = dt.getByRole("checkbox", { name: "Select every Products under review row on this page" });
  await header.check();
  await press(dt.getByRole("button", { name: "Select all 12 matching" }));
  await expect(dt.locator(".bulk p")).toBeFocused();
  await expect(dt.locator(".bulk p")).toHaveText("12 selected");
  await press(dt.locator(".bulk").getByRole("button", { name: "Clear", exact: true }));
  await expect(dt.locator(".bulk")).toHaveCount(0);
  await expect(header).toBeFocused();
  // and when a bulk action has the parent clear the selection
  await header.check();
  await press(dt.getByRole("button", { name: "Discontinue" }));
  await expect(dt.locator(".bulk")).toHaveCount(0);
  await expect(header).toBeFocused();
});

test("datatable: hiding a column removes it from every row and survives a reload", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Team members");
  await dt.getByRole("button", { name: "Columns" }).click();
  await dt.getByRole("group", { name: "Team members columns" }).getByRole("checkbox", { name: "Email" }).uncheck();
  await expect(dt.locator("thead th")).toHaveText(["Name", "Role", "Open"]);
  for (const row of await bodyRows(dt).all()) await expect(row.locator("td")).toHaveCount(3);
  await page.reload();
  await expect(datatable(page, "Team members").locator("thead th")).toHaveText(["Name", "Role", "Open"]);
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
  // what the form hears: Inertia's <Form> works out dirty state from the inputs on each change event
  await page.locator("#vue-demo form").evaluate((form) => {
    window.changes = [];
    form.addEventListener("change", (e) => e.target.id === "photos" && window.changes.push([...e.target.files].map((f) => f.name).join()));
  });
  const lastChange = () => page.evaluate(() => window.changes.at(-1));

  // a file in v-model at mount is in the native input as well
  const archived = page.locator("#vue-demo .dropzone").nth(2);
  await expect(archived.locator("li")).toHaveText(/delivery-note.pdf/);
  expect(await page.locator("#archived").evaluate((el) => [...el.files].map((f) => f.name))).toEqual(["delivery-note.pdf"]);

  // multiple: a second pick adds to the list, and the native input holds every file
  await input.setInputFiles([file("a.png"), file("b.png")]);
  await input.setInputFiles([file("c.png")]);
  await expect(output).toHaveText("v-model: [a.png, b.png, c.png]");
  await expect(zone.locator("li")).toHaveCount(3);
  expect(await input.evaluate((el) => [...el.files].map((f) => f.name))).toEqual(["a.png", "b.png", "c.png"]);
  // under photos[], so PHP keeps all three rather than the last
  expect(await input.evaluate((el) => [...new FormData(el.form)].filter(([k]) => k.startsWith("photos")).map(([k, f]) => `${k}=${f.name}`)))
    .toEqual(["photos[]=a.png", "photos[]=b.png", "photos[]=c.png"]);
  // the browser announced c.png alone; the component announces the merged list after it
  expect(await lastChange()).toBe("a.png,b.png,c.png");
  const src = await zone.locator("li img").nth(1).getAttribute("src");
  expect(src).toMatch(/^blob:/);

  // remove: the file goes, its preview is revoked, and focus moves to the next remove button
  await zone.getByRole("button", { name: "Remove b.png" }).click();
  await expect(output).toHaveText("v-model: [a.png, c.png]");
  expect(await page.evaluate(() => window.revoked)).toEqual([src]);
  await expect(zone.getByRole("button", { name: "Remove c.png" })).toBeFocused();
  expect(await input.evaluate((el) => el.files.length)).toBe(2);
  expect(await lastChange()).toBe("a.png,c.png");

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
  expect(await lastChange()).toBe("a.png,c.png,d.png");

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
  await archived.locator("label").dispatchEvent("drop", { dataTransfer });
  await expect(archived.locator("li")).toHaveCount(0);
  expect(warnings).toEqual([]);
});

// the reset handler runs a task later, by which time the reset may have unmounted the component
test("file input: a reset that unmounts it throws nothing", async ({ page }) => {
  await page.goto("/file.html");
  const errors = await page.evaluate(() => new Promise((resolve) => {
    const errors = [];
    addEventListener("error", (e) => errors.push(e.message));
    document.querySelector("#vue-demo form").reset();
    document.querySelector("#vue-demo").__vue_app__.unmount();
    setTimeout(() => setTimeout(() => resolve(errors)));
  }));
  expect(errors).toEqual([]);
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

test("combobox: with src and no create, arrows and Enter on no results create nothing", async ({ page }) => {
  const posts = [];
  page.on("request", (req) => req.method() === "POST" && posts.push(req.url()));
  await page.goto("/combobox.html");
  const box = combobox(page, "server"), search = box.getByRole("combobox", { name: "Search Customer" });
  await box.getByRole("combobox", { name: "Customer", exact: true }).click();
  await search.fill("zzzz");
  await expect(box.getByRole("status")).toHaveText("No results");
  for (const key of ["ArrowUp", "ArrowDown", "ArrowUp", "Enter"]) await page.keyboard.press(key);
  await expect(search).not.toHaveAttribute("aria-activedescendant");
  await page.waitForTimeout(300);
  await expect(box.getByRole("status")).toHaveText("No results");
  expect(posts).toEqual([]);
});

test("combobox: Enter while a search runs picks nothing, not the last query's first result", async ({ page }) => {
  await page.route("**/api/suppliers**", (route) => {
    const q = new URL(route.request().url()).searchParams.get("q");
    route.fulfill({ json: q ? [{ value: 2, label: "Beta" }] : [{ value: 1, label: "Alpha" }, { value: 2, label: "Beta" }] });
  });
  await page.goto("/combobox.html");
  const box = combobox(page, "urls"), trigger = box.getByRole("combobox", { name: "Supplier", exact: true });
  await trigger.click();
  await expect(box.getByRole("option")).toHaveText(["Alpha", "Beta"]);
  // a barcode scanner: the query and Enter inside the debounce
  await page.keyboard.type("Bet");
  await page.keyboard.press("Enter");
  await expect(box.getByRole("option")).toHaveText(["Beta", "Add “Bet”"]);
  await expect(trigger).toHaveText("");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Beta");
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

// Repeater on repeater.html: errors take Field's shapes, and the row titles take a heading level
test("repeater: errors as an object or an array show under the list, and heading-level sets the row titles", async ({ page }) => {
  await page.goto("/repeater.html");
  const errors = page.locator("#repeater-errors .repeater"), own = page.locator("#repeater-own .repeater");
  await expect(errors.locator("> .error")).toHaveText("An order can have at most five lines.");
  await expect(errors.getByRole("heading", { level: 3 })).toHaveText(["Line 1", "Line 2"]);
  await expect(own.locator("> ul.error > li")).toHaveText(["Add at least two lines.", "A gift card cannot be the only item."]);
  await expect(own.getByRole("heading", { level: 4 })).toHaveText(["Line 1"]);
  await expect(own.getByRole("heading", { level: 3 })).toHaveCount(0);
  // the list's own messages are not a row's
  await expect(own.locator("[aria-invalid]")).toHaveCount(0);
});

// DataTimeline and DataList: the frame, the days and the filter drawer
const listIn = (page, heading) => page.locator("section").filter({ has: page.getByRole("heading", { name: heading, exact: true, level: 2 }) }).locator(".datatable");
const timelineFor = (page, caption) => page.locator(".datatable").filter({ has: page.getByRole("navigation", { name: `${caption} pagination`, exact: true }) });
const drawerOf = (list) => list.getByRole("dialog");
const filtersButton = (list) => list.locator(".controls > button.btn", { hasText: "Filters" });

test("datatimeline: entries group under one heading a day, each day its own list", async ({ page }) => {
  await page.goto("/datatimeline.html");
  const list = listIn(page, "An audit log");
  await expect(list.locator("ol.timeline").first()).toBeVisible();
  await expect(list.getByRole("heading", { level: 3 }).first()).toHaveText("Today");
  await expect(list.getByRole("heading", { level: 3 }).nth(1)).toHaveText("Yesterday");
  await expect(list.locator("ol.timeline")).toHaveCount(await list.getByRole("heading", { level: 3 }).count());
  await expect(list.locator("ol.timeline").first().locator("> li")).toHaveCount(3);
  await expect(list.locator("ol.timeline").first().locator("> li time").first()).toHaveAttribute("datetime", /T/);
  // the avatar is the item's first child, so timeline.css gives it the dot's place
  await expect(timelineFor(page, "Activity").locator("ol.timeline > li").first().locator("> :first-child")).toHaveClass(/avatar/);
  // the last page holds the row with no usable date, under a heading, and the year-old one with its year
  await page.goto("/datatimeline.html?audit_page=4");
  await expect(timelineFor(page, "Audit log").getByRole("heading", { name: "No date", exact: true })).toBeVisible();
  await expect(timelineFor(page, "Audit log").locator("h3").filter({ hasText: /\d{4}$/ })).toHaveCount(1);
});

test("datatimeline: the order select is the sort, and a saved page size survives a reload", async ({ page }) => {
  await page.goto("/datatimeline.html");
  let list = timelineFor(page, "Audit log");
  const order = list.getByLabel("Order");
  await expect(order.locator("option:checked")).toHaveText("Newest first");
  await list.locator("h3").first().waitFor();
  await order.selectOption({ label: "Oldest first" });
  await expect(page).toHaveURL(/audit_dir=asc/);
  await expect(list.locator("h3").first()).toHaveText("No date");
  await page.goto("/datatimeline.html?audit_sort=at&audit_dir=up");
  await expect(timelineFor(page, "Audit log").getByLabel("Order").locator("option:checked")).toHaveText("Newest first");

  await page.goto("/datatimeline.html");
  list = timelineFor(page, "Audit log");
  await list.getByLabel("Per page").selectOption("25");
  await expect(list.getByRole("status")).toHaveText("Showing 1–25 of 36");
  await page.reload();
  await expect(timelineFor(page, "Audit log").getByRole("status")).toHaveText("Showing 1–25 of 36");
  await expect(timelineFor(page, "Audit log").getByLabel("Per page")).toHaveValue("25");
});

test("datatimeline: every filter type narrows the frame and sits in the URL", async ({ page }) => {
  await page.goto("/datatimeline.html");
  const list = listIn(page, "An audit log"), status = list.getByRole("status");
  await expect(status).toHaveText("Showing 1–10 of 36");
  await list.getByLabel("Event").selectOption("archive");
  await expect(page).toHaveURL(/audit_type=archive/);
  await expect(status).toContainText("of 6, filtered from 36");
  await list.getByLabel("Flagged only").check();
  await expect(page).toHaveURL(/audit_flagged=1/);
  await expect(status).toContainText("of 6, filtered from 36");
  await list.getByLabel("Flagged only").uncheck();
  await list.getByLabel("Event").selectOption("");
  await expect(status).toHaveText("Showing 1–10 of 36");

  const person = list.locator(".controls").getByRole("combobox", { name: "Person", exact: true });
  await person.click();
  await list.getByRole("listbox", { name: "Person" }).getByRole("option", { name: "Ann Okafor" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/audit_person/);
  await expect(status).toContainText("filtered from 36");
  await page.goto("/datatimeline.html?audit_when_from=2020-01-01&audit_when_to=2020-01-02");
  await expect(listIn(page, "An audit log").getByRole("heading", { name: "No audit log match your search." })).toBeVisible();
});

test("datatimeline: Clear filters leaves focus on the search box, Next never drops it, and a page change goes back to the top", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 500 });
  await page.goto("/datatimeline.html?audit_search=zzzz");
  let list = listIn(page, "An audit log");
  const clear = list.getByRole("button", { name: "Clear filters" });
  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("searchbox", { name: "Search Audit log" })).toBeFocused();

  // from the keyboard: the pager has gone up the page with the rows, so focus lands on the list
  await page.goto("/datatimeline.html?audit_page=3");
  list = listIn(page, "An audit log");
  const next = list.getByRole("button", { name: "Next page" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/audit_page=4/);
  await expect(list).toBeFocused();
  expect(await list.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);

  // the mouse: the disabled Next hands over to the current page, and the top of the list is back in view
  await page.goto("/datatimeline.html?audit_page=3");
  list = listIn(page, "An audit log");
  await list.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/audit_page=4/);
  await expect(list.locator('[aria-current="page"]')).toHaveText("4");
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await expect.poll(() => list.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
});

test("filter drawer: Apply commits the draft once, anything else lets it go, and the badge counts what is showing", async ({ page }) => {
  await page.goto("/datatimeline.html");
  const list = listIn(page, "Filters in a drawer"), status = list.getByRole("status"), button = filtersButton(list), drawer = drawerOf(list);
  await expect(status).toHaveText("Showing 1–5 of 36");
  await expect(button.locator(".badge")).toHaveCount(0);
  await expect(button).toHaveAccessibleName("Filters");

  await button.click();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByLabel("Event")).toBeFocused();
  await drawer.getByLabel("Event").selectOption("archive");
  await expect(page).not.toHaveURL(/activity_type/);
  await expect(status).toHaveText("Showing 1–5 of 36");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page).not.toHaveURL(/activity_type/);

  await button.click();
  await expect(drawer.getByLabel("Event"), "Escape let the draft go").toHaveValue("");
  await drawer.getByLabel("Event").selectOption("archive");
  await drawer.getByLabel("Flagged only").check();
  await drawer.getByLabel("Event").focus();
  const before = await page.evaluate(() => history.length);
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page).toHaveURL(/activity_type=archive/);
  await expect(page).toHaveURL(/activity_flagged=1/);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await expect(status).toContainText("filtered from 36");
  await expect(button.locator(".badge")).toHaveText("2 set");
  await expect(button).toHaveAccessibleName("Filters 2 set");

  // the cross discards too, and the draft starts from what is applied
  await button.click();
  await expect(drawer.getByLabel("Event")).toHaveValue("archive");
  await drawer.getByLabel("Event").selectOption("note");
  await drawer.getByRole("button", { name: "Close" }).click();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/activity_type=archive/);

  // Clear filters empties the search as it does anywhere, closes, and gives focus back
  await list.getByRole("searchbox").fill("a");
  await expect(page).toHaveURL(/activity_search=a/);
  await button.click();
  await drawer.getByRole("button", { name: "Clear filters" }).click();
  await expect(drawer).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page).not.toHaveURL(/activity_/);
  await expect(list.getByRole("searchbox")).toHaveValue("");
  await expect(button.locator(".badge")).toHaveCount(0);
  await expect(status).toHaveText("Showing 1–5 of 36");
});

test("filter drawer: the badge counts every filter in force by default, or only what the reader changed", async ({ page }) => {
  await page.goto("/datatimeline.html");
  const inForce = timelineFor(page, "Team activity"), changed = timelineFor(page, "Changed activity");
  await expect(filtersButton(inForce).locator(".badge")).toHaveText("1 set");
  await expect(filtersButton(changed).locator(".badge")).toHaveCount(0);

  for (const [list, count] of [[inForce, "2 set"], [changed, "1 set"]]) {
    await filtersButton(list).click();
    await drawerOf(list).getByLabel("Event").selectOption("note");
    await drawerOf(list).getByRole("button", { name: "Apply", exact: true }).click();
    await expect(filtersButton(list).locator(".badge")).toHaveText(count);
  }

  // Clear takes both to nothing, with focus on the button, as neither list has a search box
  for (const list of [inForce, changed]) {
    await filtersButton(list).click();
    await drawerOf(list).getByRole("button", { name: "Clear filters" }).click();
    await expect(drawerOf(list)).toBeHidden();
    await expect(filtersButton(list).locator(".badge")).toHaveCount(0);
    await expect(filtersButton(list)).toBeFocused();
    await expect(list.getByRole("searchbox")).toHaveCount(0);
  }
});

test("datalist: a card grid gets the frame, a sort select, and a filter of its own that is drafted and counted", async ({ page }) => {
  await page.goto("/datalist.html");
  const list = listIn(page, "A card grid"), cards = list.locator("ul.grid > li"), button = filtersButton(list), drawer = drawerOf(list);
  await expect(cards).toHaveCount(10);
  await expect(list.getByRole("status")).toHaveText("Showing 1–10 of 23");

  await expect(button.locator("svg")).toBeVisible();
  await expect(list.locator(".controls > .field")).toHaveCount(0);
  await button.click();
  await drawer.getByLabel("Sort").selectOption({ label: "Price, high to low" });
  await expect(page).not.toHaveURL(/cards_sort/);
  const before = await page.evaluate(() => history.length);
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await expect(button.locator(".badge"), "an order is not a filter").toHaveCount(0);
  await expect(page).toHaveURL(/cards_sort=price/);
  await expect(page).toHaveURL(/cards_dir=desc/);
  await expect(cards.first().getByRole("heading")).toHaveText("Sample W");
  await page.goto("/datalist.html?cards_sort=price&cards_dir=desc");
  await expect(list.getByLabel("Sort").locator("option:checked")).toHaveText("Price, high to low");
  await page.goto("/datalist.html?cards_sort=name&cards_dir=desc");
  await expect(list.getByLabel("Sort").locator("option:checked")).toHaveText("Custom");

  // Escape lets a changed order go, and Clear filters leaves the order alone
  await page.goto("/datalist.html?cards_sort=price&cards_dir=desc&cards_page=2");
  await button.click();
  await drawer.getByLabel("Sort").selectOption({ label: "Name" });
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/cards_dir=desc/);
  await button.click();
  await expect(drawer.getByLabel("Sort").locator("option:checked")).toHaveText("Price, high to low");
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(page, "an Apply that changed nothing stays on its page").toHaveURL(/cards_page=2/);
  await button.click();
  await drawer.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/cards_dir=desc/);
  await page.goto("/datalist.html");

  await button.click();
  await drawer.getByLabel("Name contains").fill("Sample B");
  await expect(cards).toHaveCount(10);
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(button.locator(".badge")).toHaveText("1 set");
  await button.click();
  await expect(drawer.getByLabel("Name contains")).toHaveValue("Sample B");
  await drawer.getByRole("button", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(10);
  await expect(button.locator(".badge")).toHaveCount(0);
});

test("datatable: filters in a drawer leave the toolbar to the search box and one button", async ({ page }) => {
  await page.goto("/datatable.html");
  const dt = datatable(page, "Stocklist"), button = filtersButton(dt), drawer = drawerOf(dt);
  await expect(dt.locator(".controls > .field")).toHaveCount(0);
  await expect(dt.getByRole("status")).toHaveText("Showing 1–5 of 12");
  await button.click();
  await drawer.getByRole("combobox", { name: "Availability", exact: true }).selectOption("in_stock");
  // a panel opened inside the drawer is not a click outside it
  const size = drawer.getByRole("combobox", { name: "Size", exact: true });
  await size.click();
  await drawer.getByRole("listbox", { name: "Size" }).getByRole("option", { name: "L", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await expect(size).toHaveText("L");
  await size.click();
  await drawer.getByRole("listbox", { name: "Size" }).getByRole("option", { name: "L", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await drawer.getByLabel("Added from").fill("2026-03-01");
  await expect(dt.getByRole("status")).toHaveText("Showing 1–5 of 12");
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(button.locator(".badge")).toHaveText("2 set");
  await expect(dt.getByRole("status")).toContainText("filtered from 12");
  await expect(page).toHaveURL(/stocklist_added_from=2026-03-01/);
});

// lists sharing a URL, against a stand-in server slow enough for their changes to overlap
const severalLists = async (page, query = "") => {
  await page.goto(`/app/several-lists.html${query}`);
  await expect(page.locator(".datatable").first()).toBeVisible();
};
const listNamed = (page, caption) => page.locator("section").filter({ has: page.getByRole("heading", { name: caption, exact: true, level: 2 }) }).locator(".datatable");
const choose = (select, value) => select.evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); }, value);
// from inside the page, so both changes land inside the server's delay however busy the machine is
const chooseThen = async (select, value, second) => select.evaluate(async (el, [v, then]) => {
  el.value = v;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (then.tagName === "SELECT") { then.value = "y"; then.dispatchEvent(new Event("change", { bubbles: true })); } else then.click();
}, [value, await second.elementHandle()]);

test("several lists: a change that overtakes another list's reloads that list's rows too", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One"), two = listNamed(page, "Two");
  await page.evaluate(() => { window.delay = 400; });
  await chooseThen(one.getByLabel("Type"), "x", two.getByRole("button", { name: "Next page" }));
  await expect(page).toHaveURL(/one_type=x/);
  await expect(page).toHaveURL(/two_page=2/);
  await expect(one.getByRole("status")).toHaveText("Showing 1–10 of 15, filtered from 30");
  await expect(one.locator("li", { hasText: "(y)" })).toHaveCount(0);
  await expect(two.getByRole("status")).toHaveText("Showing 11–20 of 30");
  const visits = await page.evaluate(() => window.visits);
  expect(visits.at(-1).only.toSorted()).toEqual(["one", "two"]);
});

test("several lists: a list in the browser keeps a change made during a server list's visit", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One"), browser = listNamed(page, "Browser");
  await page.evaluate(() => { window.delay = 400; });
  await chooseThen(one.getByLabel("Type"), "x", browser.getByLabel("Type"));
  await expect(one.getByRole("status")).toHaveText("Showing 1–10 of 15, filtered from 30");
  await expect(page).toHaveURL(/one_type=x/);
  await expect(page).toHaveURL(/browser_type=y/);
  await expect(browser.getByLabel("Type")).toHaveValue("y");
  await expect(browser.getByRole("status")).toContainText("filtered from 12");
  expect((await page.evaluate(() => window.visits)).at(-1).only).toEqual(["one"]);
});

test("filter drawer: reopened before the server answers, it shows and keeps the order just applied", async ({ page }) => {
  await severalLists(page);
  const list = listNamed(page, "Drawer"), button = filtersButton(list), drawer = drawerOf(list);
  await page.evaluate(() => { window.delay = 1500; });
  await button.click();
  await drawer.getByLabel("Order").selectOption({ label: "Z to A" });
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await button.click();
  await expect(drawer.getByLabel("Order").locator("option:checked"), "before the response").toHaveText("Z to A", { timeout: 500 });
  await drawer.getByLabel("Type").selectOption("x");
  await drawer.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page).toHaveURL(/drawer_type=x/);
  await expect(page).toHaveURL(/drawer_dir=desc/);
  await expect(list.locator("li").first()).toContainText("Record 30");
});

test("datatimeline frame: a page change that never landed does not move the reader later", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One"), type = one.getByLabel("Type");
  await page.evaluate(() => { window.fail = true; });
  await one.getByRole("button", { name: "Next page" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.visits.length)).toBe(1);
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.fail = false; });
  await type.focus();
  await choose(type, "none");
  await expect(one.getByRole("status")).toContainText("Showing 0 of 0");
  await expect(type).toBeFocused();
});

test("datalist: with no search box or count of its own, Clear filters leaves focus on the named list", async ({ page }) => {
  await page.goto("/datalist.html?plain_brand=Nobody");
  const list = page.locator(".datatable").filter({ hasText: "Made to order" });
  const clear = list.getByRole("button", { name: "Clear filters" });
  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(list).toBeFocused();
  await expect(list).toHaveAccessibleName("Made to order");
  await expect(list.locator("ul.grid > li")).toHaveCount(3);
});

test("several lists: a slow page change leaves a keyboard reader where they have gone", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One"), type = listNamed(page, "Two").getByLabel("Type");
  await page.evaluate(() => { window.delay = 500; });
  await one.getByRole("button", { name: "Next page" }).focus();
  await page.keyboard.press("Enter");
  await type.focus();
  await expect(one.getByRole("status")).toHaveText("Showing 11–20 of 30");
  await expect(type).toBeFocused();
});

test("several lists: a search that overtakes a filter keeps the filter's step in history", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One");
  const before = await page.evaluate(() => { window.delay = 800; return history.length; });
  await choose(one.getByLabel("Type"), "x");
  await one.getByRole("searchbox").fill("Record");
  await expect(page).toHaveURL(/one_type=x/);
  await expect(page).toHaveURL(/one_search=Record/);
  await expect(one.getByRole("status")).toContainText("filtered from 30");
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await page.goBack();
  await expect(page).not.toHaveURL(/one_type/);
});

test("several lists: another list's partial reload does not dim a list held in the browser", async ({ page }) => {
  await severalLists(page);
  const one = listNamed(page, "One"), browser = listNamed(page, "Browser");
  await page.evaluate(() => { window.delay = 800; });
  await choose(one.getByLabel("Type"), "x");
  await expect(one.locator("> ul")).toHaveAttribute("aria-busy", "true");
  await expect(browser.locator("> ul")).not.toHaveAttribute("aria-busy", "true");
});

test("list frame: a long pager fits a phone, and a list with no search box ignores one in the URL", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/datatimeline.html");
  const nav = page.getByRole("navigation", { name: "Activity pagination", exact: true });
  await expect(nav.getByRole("button")).toHaveCount(3);
  await expect(nav.locator('[aria-current="page"]')).toBeVisible();
  await nav.getByRole("button", { name: "Next page" }).click();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto("/datalist.html?plain_search=zzz");
  await expect(listIn(page, "A footer of your own").locator("ul.grid > li")).toHaveCount(3);
});

