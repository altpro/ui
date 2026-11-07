// A production build, which is the only place this shows. Lightning CSS, Vite 8's CSS minifier, rewrites light-dark()
// for browsers below build.cssTarget, and scheme regions then silently keep the page's colours (README, Production builds).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite";

test("a production build keeps light-dark(), or scheme regions keep the page's colours", async (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "altpro-ui-build-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));
  await build({ logLevel: "silent", build: { outDir } });
  const css = readdirSync(join(outDir, "assets")).filter((f) => f.endsWith(".css"));
  assert.ok(css.length > 0);
  for (const file of css) assert.doesNotMatch(readFileSync(join(outDir, "assets", file), "utf8"), /lightningcss-(light|dark)/, file);
  assert.ok(css.some((file) => readFileSync(join(outDir, "assets", file), "utf8").includes("light-dark(")));
});
