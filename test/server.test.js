import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../server.js";

let server; let base;
before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));

test("home page is served with the ScamShield name", async () => {
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /ScamShield/);
});

test("security headers block network connections from the page", async () => {
  const res = await fetch(base + "/");
  const csp = res.headers.get("content-security-policy");
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /default-src 'self'/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});

test("modules are served with a JavaScript content type", async () => {
  const res = await fetch(base + "/js/analyzer.js");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /javascript/);
});

test("path traversal and unknown files are refused", async () => {
  const bad = await fetch(base + "/..%2fserver.js");
  assert.ok([403, 404].includes(bad.status));
  assert.equal((await fetch(base + "/nope.html")).status, 404);
});

test("the server has no endpoint that accepts submitted data", async () => {
  const res = await fetch(base + "/", { method: "POST", body: "message=secret" });
  assert.equal(res.status, 405);
});
