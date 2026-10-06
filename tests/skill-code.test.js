// The skill's app code is the code the demo runs. A ```vue or ```js block in a reference file whose first line names
// a file under resources/js/ (`<!-- resources/js/Pages/Products/Edit.vue -->`, `// resources/js/toast.js`) must be
// that file in demo/app/, byte for byte, when the demo has it; and every page, layout and composable the demo runs
// must be such a block, so an agent copies code the browser tests have driven. Doc-only examples have no demo file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const refs = new URL("../resources/boost/skills/altpro-ui/references/", import.meta.url);
const app = new URL("../demo/app/", import.meta.url);
const block = /```(?:vue|js)\n(?:<!-- |\/\/ )resources\/js\/(\S+?)(?: -->)?\n([\s\S]*?)```/g;
const shown = new Set();

for (const ref of readdirSync(refs)) {
  for (const [, path, code] of readFileSync(new URL(ref, refs), "utf8").matchAll(block)) {
    if (!existsSync(new URL(path, app))) continue;
    shown.add(path);
    test(`${ref}: resources/js/${path} is demo/app/${path}`, () => {
      assert.equal(code, readFileSync(new URL(path, app), "utf8"));
    });
  }
}

test("every page, layout and composable in demo/app is shown in a reference file", () => {
  const run = ["Pages", "Layouts", "composables"]
    .flatMap((dir) => readdirSync(new URL(`${dir}/`, app), { recursive: true }).map((f) => `${dir}/${f.replaceAll("\\", "/")}`))
    .filter((f) => /\.(vue|js)$/.test(f))
    .concat("toast.js");
  assert.deepEqual(run.filter((f) => !shown.has(f)), []);
});
