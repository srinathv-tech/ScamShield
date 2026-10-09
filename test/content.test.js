import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { triage } from "../public/js/analyzer.js";
import { EXAMPLES, QUIZ, SIGN_OPTIONS } from "../public/js/data.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === "node_modules" ? [] : walk(path.join(dir, e.name))) : [path.join(dir, e.name)]);

test("at least 8 synthetic examples cover the required scam types", () => {
  assert.ok(EXAMPLES.length >= 8);
  const cats = EXAMPLES.map((e) => e.category.toLowerCase()).join(" | ");
  for (const needle of ["delivery", "job", "bank", "otp", "investment", "support", "prize", "family"]) {
    assert.ok(cats.includes(needle), "missing category: " + needle);
  }
});

test("checker shows every expected indicator for every example", () => {
  let expectedTotal = 0; let shown = 0;
  for (const ex of EXAMPLES) {
    const got = new Set(triage({ message: ex.message }).indicators.map((i) => i.id));
    for (const id of ex.expected) { expectedTotal += 1; if (got.has(id)) shown += 1; }
    assert.ok(ex.expected.every((id) => SIGN_OPTIONS.some((o) => o.id === id)), ex.id + " uses unknown sign");
  }
  assert.equal(shown, expectedTotal);
});

test("every example is flagged at least 'Review carefully'", () => {
  for (const ex of EXAMPLES) assert.notEqual(triage({ message: ex.message }).level, "none", ex.id);
});

test("quiz questions are well formed", () => {
  assert.ok(QUIZ.length >= 5);
  for (const q of QUIZ) {
    assert.ok(q.options.length >= 2);
    assert.ok(q.answer >= 0 && q.answer < q.options.length);
    assert.ok(q.why.length > 10);
  }
});

test("sample data contains no real-looking personal data", () => {
  const text = JSON.stringify(EXAMPLES);
  assert.ok(!/\b\d{10,}\b/.test(text), "long number found");
  assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text), "email found");
});

test("project text and source files are English/ASCII only", () => {
  // Allowed non-ASCII: typographic bullets, rupee sign and dashes used in regexes/UI.
  const allowed = /[•…₹€£—–’“”]/g;
  const files = [...walk(path.join(ROOT, "public")), ...walk(path.join(ROOT, "docs")),
    path.join(ROOT, "README.md")].filter((f) => /\.(js|html|css|md|txt|svg)$/.test(f));
  for (const f of files) {
    let txt; try { txt = readFileSync(f, "utf8"); } catch { continue; }
    const bad = txt.replace(allowed, "").match(/[^\x00-\x7f]/g);
    assert.equal(bad, null, `${path.relative(ROOT, f)} has non-English characters`);
  }
});

test("no language switcher or translation feature exists", () => {
  const html = readFileSync(path.join(ROOT, "public/index.html"), "utf8") + readFileSync(path.join(ROOT, "public/js/app.js"), "utf8");
  assert.ok(!/translate|language[- ]?switch|lang-select|hreflang/i.test(html));
});
