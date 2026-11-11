// Every spec imports test and expect from here, not from @playwright/test.
//
// Headless Chromium hides scrollbars, yet still reserves the 15px that
// `scrollbar-gutter: stable` on :root asks for, while clientWidth reports the
// full width. No real browser does that: a classic scrollbar fills the strip and
// an overlay one reserves nothing. So in Chromium the gutter goes back to auto,
// as an overlay scrollbar would have it, and widths and breakpoints read as they
// do in Firefox and WebKit. browsers.spec.js checks the library still sets it.
import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  context: async ({ context, browserName }, use) => {
    if (browserName === "chromium") {
      await context.addInitScript(() => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(":root { scrollbar-gutter: auto }");
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      });
    }
    await use(context);
  },
});

export { expect };
