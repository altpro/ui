# An independent read

For when the user asks for a second opinion on a review. Your own review drifts towards approving what you built. Send one fresh reviewer, or as many as the user asks for, the screenshots, the notes from driving the flows, and the brief below, with nothing of your reasoning.

Check each finding against the screenshot, add those you agree with to the report, and say which you decline and why. One read per request.

The brief, with the placeholders filled in:

```markdown
# Design review: <app name> screenshots

You are an independent judge of visual design quality. Score these screenshots of <app name>, <one line on what the app is and who uses it>, and say exactly what stands between them and a 9 out of 10. They should look like a polished, credible, production admin tool, the quality of Linear, Stripe's dashboard or Shopify Polaris.

Screenshots (Chromium; file names give the scheme and the viewport width):

<one absolute path per line>

Open every screenshot as an image. You may read the source to explain a finding: the pages are in <resources/js/pages/…>, the app's styles in <resources/css/app.css>. The components come from altpro/ui (vendor/altpro/ui/resources/css/components/). Its rules for screens are in .claude/skills/altpro-ui-design/SKILL.md and that skill's references/; judge against them as well as your own eye.

Constraints on any fix you suggest: colours only from the theme tokens; WCAG 2.2 AA (4.5:1 text contrast in both schemes, 24px minimum targets, a visible focus ring); prefer the app's own markup and styles over changing altpro/ui.

Work read-only: change no files, and make no commits or comments. Judge strictly; 9 means a seasoned product designer would ship it with only nitpicks.

Reply with:
1. Overall score: N/10.
2. A score per screenshot.
3. Blocking issues that keep it below 9, most important first: screenshot, where on it, what is wrong, and the concrete fix (a value, a class, a markup change; file:line when you can). Name the screen rule each one breaks, or write "no rule".
4. Nitpicks that would not block a 9.
```
