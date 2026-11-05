# Reviewing screens

Steps 2 to 5 of the `altpro-ui-design` skill: shoot the set, score it against the screen rules, and get an independent read.

## The set

For every screen you touched:

| Shot | Viewport | Scheme |
|------|----------|--------|
| The screen | 1440 wide, as tall as the page | light |
| The screen | 1440 wide, as tall as the page | dark |
| The screen | 390 wide, as tall as the page | light |
| Each dialog and drawer, open | 1440 × 900 | light |

Add a shot for any state the screen has that the others don't show: empty, a validation failure, a filter that matches nothing.

**As tall as the page:** set the viewport's height to the page's scroll height before the shot, instead of taking a full-page screenshot. A full-page shot of a 900px viewport stops the sticky sidebar at 900px, which reads as a broken layout and sends the review after a bug that isn't there.

## The script

Playwright, against the app's own URL: the one in `APP_URL`, from whatever server the developer already runs. Add Playwright to the app if it doesn't have it (`npm i -D playwright && npx playwright install chromium`). Keep the script and its output out of the repository, in a scratch directory.

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
for (const [scheme, width] of [["light", 1440], ["dark", 1440], ["light", 390]]) {
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

## Scoring

Open every PNG. Take each one through every section of the screen rules: rhythm, type and numbers, copy, status and severity, actions and links, data and charts, dialogs and drawers, phone, dark scheme, imagery. Then compare the screens with each other. Most blocking issues are drift between screens, and no single shot shows that.

Score each shot out of 10:

- **9:** a seasoned product designer would ship it with only nitpicks.
- **8:** credible, but a reviewer would send it back for a few specific things.
- **7 or below:** something is visibly broken (clipped, overlapping, unreadable), or the screen doesn't hold together as one system.

For each blocking issue, write down the shot, where on the screen, the rule it breaks, and the fix as a value or a class. Fix them all, then shoot the set again; don't patch a single shot.

## An independent read

Your own review drifts towards approving what you built. For a new screen, a redesign or a release, hand the screenshots to a fresh reviewer: a subagent, or two on different models if the harness has them. Give the reviewer the brief below, the paths, and nothing of your reasoning. When it comes back, check each finding against the screenshot before acting on it. Fix what you agree with, and note what you decline and why. Then send a new reviewer the new set with the round's changes and the declined items. Stop when the reviewer scores the set 9 or more with no blocking issues.

The brief, with the placeholders filled in:

```markdown
# Design review: <app name> screenshots

You are an independent judge of visual design quality. Score these screenshots of <app name>, <one line on what the app is and who uses it>, and say exactly what stands between them and a 9 out of 10. They should look like a polished, credible, production admin tool, the quality of Linear, Stripe's dashboard or Shopify Polaris.

Screenshots (Chromium; file names give the scheme and the viewport width):

<one absolute path per line>

Open every screenshot as an image. You may read the source to explain a finding: the pages are in <resources/js/pages/…>, the app's styles in <resources/css/app.css>. The components come from altpro/ui (vendor/altpro/ui/resources/css/components/). Its rules for screens are in .claude/skills/altpro-ui-design/SKILL.md; judge against them as well as your own eye.

Constraints on any fix you suggest: colours only from the theme tokens; WCAG 2.2 AA (4.5:1 text contrast in both schemes, 24px minimum targets, a visible focus ring); prefer the app's own markup and styles over changing altpro/ui.

<This is round N. Earlier scores: …. Since the last round: …. Declined, with reasons: …. Score the new screenshots on their own merits.>

Work read-only: change no files, and make no commits or comments. Judge strictly; 9 means a seasoned product designer would ship it with only nitpicks.

Reply with:
1. Overall score: N/10.
2. A score per screenshot.
3. Blocking issues that keep it below 9, most important first: screenshot, where on it, what is wrong, and the concrete fix (a value, a class, a markup change; file:line when you can).
4. Nitpicks that would not block a 9.
5. One line: what would make it a 10.
```
