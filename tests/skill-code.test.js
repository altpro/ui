// The skill's app code is the code the demo runs: every ```vue or ```js block in a reference file whose first line
// names a file under resources/js/ (`<!-- resources/js/Pages/Products/Edit.vue -->`, `// resources/js/toast.js`)
// must be that file in demo/app/, byte for byte, so an agent copies code the browser tests have driven.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const refs = new URL("../resources/boost/skills/altpro-ui/references/", import.meta.url);
const app = new URL("../demo/app/", import.meta.url);
const block = /```(?:vue|js)\n(?:<!-- |\/\/ )resources\/js\/(\S+?)(?: -->)?\n([\s\S]*?)```/g;

for (const ref of readdirSync(refs)) {
  for (const [, path, code] of readFileSync(new URL(ref, refs), "utf8").matchAll(block)) {
    test(`${ref}: resources/js/${path} is demo/app/${path}`, () => {
      assert.equal(code, readFileSync(new URL(path, app), "utf8"));
    });
  }
}
