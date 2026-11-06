---
name: altpro-ui-review
description: Review an app's screens built with altpro/ui for UI and UX problems and report ranked findings. Only when the user asks for a review.
disable-model-invocation: true
---

# Reviewing an altpro/ui app

One pass over the screens the user names, ending in a report. The user decides what happens to the findings.

## Steps

1. **Set the scope.** The screens the user named, or else those changed on the current branch. List each screen and the flows it offers: create, edit, filter, delete, a failed save. Done when the list is written down. If nothing names a screen, ask.
2. **Load the rules.** Load the `altpro-ui-design` skill and the references for the kinds of screen in scope. Done when each screen has its rules open.
3. **Drive every flow** in a real browser, against the app's own URL from `APP_URL`. Type into every field a character at a time, submit each form with bad values, create a record and read the screen it lands on, and work each flow from the keyboard. Screenshots can't show a date field that blanks the page. Done when each flow from step 1 has run and what went wrong is noted.
4. **Shoot the set.** [The set and script](#the-set) below. Done when every PNG exists and you have opened each one.
5. **Score.** Take each shot through every section of `altpro-ui-design`, starting with Priority, then the references. Compare the screens with each other: most problems are drift between screens, and no single shot shows that. Before scoring a screen, write down the user's next action and the fact they need for it, and find both in the 390 shot; below the first screenful is a blocking issue. Score as a stranger would: agents have scored their own screens 1 to 1.5 points above independent reviewers. Done when each shot has a score and its issues are listed.
6. **Report and stop.** Reply with:
   1. Overall score out of 10, and a score per shot.
   2. Blocking issues, most important first: screen or shot, where on it, what is wrong, the rule it breaks (or "no rule"), and the fix as a value, a class or a markup change.
   3. Nitpicks.

   Done when the report is delivered. Leave the code as it is until the user picks what to fix.

**An independent read** runs only when the user asks for one: [independent-read.md](references/independent-read.md).

## Scoring

- **9:** a seasoned product designer would ship it with only nitpicks.
- **8:** credible, but a reviewer would send it back for a few specific things.
- **7 or below:** something is visibly broken (clipped, overlapping, unreadable), or the screen doesn't hold together as one system.

A blocking issue is a broken rule, or anything a product designer would send back. A "no rule" finding the user agrees with is a convention the rules lack: record it where the next screen's builder will read it, such as the app's AGENTS.md.

## The set

For every screen in scope:

| Shot | Viewport | Scheme |
|------|----------|--------|
| The screen | 1440 wide, as tall as the page | light and dark |
| The screen | 1280, 1024 and 768 wide, as tall as the page | light |
| The screen | 390 wide, as tall as the page | light |
| Each dialog and drawer, open | 1440 × 900 | light |

The sidebar takes width a viewport query can't see, so a 1280 laptop can have less room than a 768 tablet. Add a shot for any state the others don't show: empty, a validation failure, a filter that matches nothing, a record just created.

**As tall as the page:** set the viewport's height to the page's scroll height before the shot, instead of taking a full-page screenshot. A full-page shot of a 900px viewport stops the sticky sidebar at 900px, which reads as a broken layout.

Playwright, against whatever server the developer already runs. Add it to the app if it isn't there (`npm i -D playwright && npx playwright install chromium`). Keep the script and its output in a scratch directory, out of the repository.

```js
// screens.mjs: APP_URL=… SCREENS_EMAIL=… SCREENS_PASSWORD=… node screens.mjs out/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.APP_URL;
const out = process.argv[2] ?? "screens";
// [file name, path, an optional step that opens a dialog before the shot]
const screens = [
  ["dashboard", "/dashboard"],
  ["products", "/products"],
  ["product", "/products/1/edit"],
  ["product-delete", "/products/1/edit", (page) => page.getByRole("button", { name: "Delete" }).click()],
];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [scheme, width] of [["light", 1440], ["dark", 1440], ["light", 1280], ["light", 1024], ["light", 768], ["light", 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
  await page.goto(`${base}/login`);
  await page.locator("input[name=email]").fill(process.env.SCREENS_EMAIL);
  await page.locator("input[name=password]").fill(process.env.SCREENS_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  for (const [name, path, open] of screens) {
    if (open && (scheme !== "light" || width !== 1440)) continue;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + path, { waitUntil: "networkidle" });
    if (open) await open(page);
    else await page.setViewportSize({ width, height: Math.max(900, await page.evaluate(() => document.documentElement.scrollHeight)) });
    await page.waitForTimeout(300); // let transitions finish
    await page.screenshot({ path: `${out}/${name}-${scheme}-${width}.png` });
  }
  await page.close();
}
await browser.close();
```

`colorScheme` drives the scheme because altpro/ui follows the OS. If the app pins one from `localStorage.theme`, the new page starts with that empty, so the OS setting applies.
