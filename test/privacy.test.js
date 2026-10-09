import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const jsFiles = readdirSync(path.join(PUB, "js")).map((f) => path.join(PUB, "js", f));
const read = (f) => readFileSync(f, "utf8");

test("browser code has no network, popup, redirect or eval calls", () => {
  const banned = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /EventSource/,
    /window\.open\s*\(/, /location\.(href|assign|replace)\s*=/, /\beval\s*\(/, /new Function\s*\(/, /\.innerHTML\s*=/, /document\.write/];
  for (const f of jsFiles) {
    const src = read(f);
    for (const re of banned) assert.ok(!re.test(src), `${path.basename(f)} matches ${re}`);
  }
});

test("page loads no external scripts, styles or fonts", () => {
  const html = read(path.join(PUB, "index.html"));
  const css = read(path.join(PUB, "styles.css"));
  assert.ok(!/(src|href)=["']https?:\/\//i.test(html));
  assert.ok(!/url\(\s*["']?https?:/i.test(css));
  assert.ok(!/@import/i.test(css));
});

test("submitted links are never turned into clickable links", () => {
  const src = read(path.join(PUB, "js/app.js"));
  // The only <a href> built from data is the configured official portal URL.
  const hrefs = [...src.matchAll(/h\("a",\s*\{[^}]*href:\s*([^,}]+)/g)].map((m) => m[1].trim());
  for (const h of hrefs) assert.ok(/^"#|REPORTING\.officialPortalUrl|URL\.createObjectURL/.test(h), "unexpected href: " + h);
});

test("only the two documented localStorage keys are used", () => {
  const src = read(path.join(PUB, "js/app.js"));
  const keys = [...src.matchAll(/"scamshield\.[a-z]+"/g)].map((m) => m[0]);
  assert.deepEqual([...new Set(keys)].sort(), ['"scamshield.prefs"', '"scamshield.saved"']);
});

test("the incident checklist does not ask for secrets", () => {
  const src = read(path.join(PUB, "js/app.js"));
  assert.ok(!/type:\s*"password"/.test(src));
  assert.match(src, /Do not include passwords, OTPs, PINs or card numbers/);
});
