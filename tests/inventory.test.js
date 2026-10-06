// The "Adding a component" checklist in AGENTS.md as a test: every component CSS file is
// imported, demoed, in the menu and documented. tests/a11y.spec.js scans every demo page itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
// the .html strings in `const <list> = [...];`; in demo.js only the first item of each entry is a page
const pagesIn = (path, list, item) => [...read(path).match(new RegExp(`const ${list} = \\[([\\s\\S]*?)\\n?\\];`))[1].matchAll(item)].map((m) => m[1]);

// components whose demo page or skill reference has another name than the CSS file
const aliases = {
  dropzone: { demo: "file", ref: "file-input" },
  input: { demo: "field" },
};

const components = readdirSync(new URL("resources/css/components/", root)).filter((f) => f.endsWith(".css")).map((f) => f.slice(0, -4));
const imports = [...read("resources/css/ui.css").matchAll(/@import "\.\/components\/([\w-]+)\.css"/g)].map((m) => m[1]);
const menu = pagesIn("demo/demo.js", "components", /\["([^"]+\.html)"/g);
const skill = read("resources/boost/skills/altpro-ui/SKILL.md");
const demos = readdirSync(new URL("demo/", root), { recursive: true }).filter((f) => f.endsWith(".html")).map((f) => f.replaceAll("\\", "/"));

for (const name of components) {
  const demo = `${aliases[name]?.demo ?? name}.html`;
  const ref = `references/${aliases[name]?.ref ?? name}.md`;
  test(name, () => {
    assert.ok(imports.includes(name), `${name}.css is not imported in resources/css/ui.css`);
    assert.ok(demos.includes(demo), `demo/${demo} does not exist`);
    assert.ok(menu.includes(demo), `${demo} is not in the components array in demo/demo.js`);
    assert.ok(existsSync(new URL(`resources/boost/skills/altpro-ui/${ref}`, root)), `the skill has no ${ref}`);
    assert.ok(skill.includes(`](${ref})`), `the Components table in SKILL.md does not link ${ref}`);
  });
}
