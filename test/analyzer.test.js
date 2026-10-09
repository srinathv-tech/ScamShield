import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeMessage, analyzeUrl, triage, maskSensitive, registrableDomain, parseUrlSafely, LABELS,
} from "../public/js/analyzer.js";

const ids = (list) => list.map((i) => i.id);

test("OTP request is detected and rated High caution", () => {
  const r = triage({ message: "Your account will be blocked. Share the OTP you received to verify." });
  assert.equal(r.status, "ok");
  assert.ok(ids(r.indicators).includes("credential-request"));
  assert.ok(ids(r.indicators).includes("threat"));
  assert.equal(r.label, LABELS.high);
});

test("every indicator carries name, evidence, explanation and action", () => {
  const r = triage({ message: "Urgent! Pay a registration fee of Rs. 500 now. Contact our manager on WhatsApp." });
  assert.ok(r.indicators.length >= 3);
  for (const i of r.indicators) {
    for (const key of ["name", "evidence", "why", "action"]) {
      assert.ok(typeof i[key] === "string" && i[key].length > 0, `${i.id} missing ${key}`);
    }
  }
});

test("remote-access apps are a strong sign", () => {
  const found = analyzeMessage("Please install AnyDesk so we can fix your refund.");
  assert.equal(found[0].id, "remote-access");
  assert.equal(found[0].severity, "high");
});

test("fake job fee, prize and investment patterns are detected", () => {
  assert.ok(ids(analyzeMessage("Pay a refundable registration fee to confirm your job.")).includes("payment-demand"));
  assert.ok(ids(analyzeMessage("Congratulations, you have won a lottery prize!")).includes("unrealistic-reward"));
  assert.ok(ids(analyzeMessage("Guaranteed returns with no risk, double your money.")).includes("unrealistic-reward"));
});

test("family emergency pattern is detected", () => {
  assert.ok(ids(analyzeMessage("Hi Mom, this is my new number. I am in the hospital.")).includes("family-emergency"));
});

test("ordinary friendly messages show no obvious warning signs", () => {
  for (const t of [
    "Hi, are we still meeting for lunch at 1pm tomorrow?",
    "Your appointment is confirmed for Monday at 10 am. See you then.",
    "Thanks for the notes from class. I will send mine tonight.",
  ]) {
    const r = triage({ message: t });
    assert.equal(r.level, "none", t);
    assert.equal(r.label, LABELS.none);
  }
});

test("a single weak sign never reaches High caution", () => {
  const r = triage({ message: "Dear customer, thank you for shopping with us." });
  assert.notEqual(r.level, "high");
});

test("low-risk result carries the 'does not prove legitimate' disclaimer", () => {
  const r = triage({ message: "See you at lunch." });
  assert.match(r.disclaimer, /does not prove/i);
  assert.match(r.disclaimer, /not a verdict|triage guidance/i);
});

test("no percentage or probability is returned or implied", () => {
  const r = triage({ message: "Urgent: share your OTP now or your account will be blocked." });
  const text = JSON.stringify({ label: r.label, ind: r.indicators, steps: r.steps });
  assert.ok(!/\d+\s?%\s*(likely|chance|probability|confidence)/i.test(text));
  assert.ok(!("probability" in r) && !("confidence" in r));
});

test("evidence excerpts mask long digit sequences", () => {
  const r = triage({ message: "Share the OTP 483920 now" });
  const ev = r.indicators.find((i) => i.id === "credential-request").evidence;
  assert.ok(!ev.includes("483920"));
  assert.equal(maskSensitive("code 123456"), "code ••••••");
});

test("empty input and over-long input are handled", () => {
  assert.equal(triage({}).status, "empty");
  assert.equal(triage({ message: "   ", url: "" }).status, "empty");
  assert.equal(triage({ message: "a".repeat(5001) }).status, "error");
  assert.deepEqual(analyzeMessage(undefined), []);
});

// ----- URLs -----
test("URL shortener is flagged without being called malicious", () => {
  const r = analyzeUrl("https://bit.ly/3abcde");
  assert.ok(ids(r.indicators).includes("url-shortener"));
  assert.ok(!r.indicators.some((i) => /malicious|dangerous|scam site/i.test(i.name + i.why)));
});

test("IP address, '@' trick, punycode and missing HTTPS are flagged", () => {
  assert.ok(ids(analyzeUrl("http://192.168.0.10/login").indicators).includes("url-ip-address"));
  assert.ok(ids(analyzeUrl("https://mybank.com@other.example/x").indicators).includes("url-at-symbol"));
  assert.ok(ids(analyzeUrl("https://xn--pypal-4ve.example/").indicators).includes("url-punycode"));
  assert.ok(ids(analyzeUrl("http://example.com/a").indicators).includes("url-no-https"));
});

test("trust words in a sub-part of the domain are explained using the real domain", () => {
  const r = analyzeUrl("https://secure-bank.login.example.com/verify");
  const i = r.indicators.find((x) => x.id === "url-trust-words-subdomain");
  assert.ok(i);
  assert.match(i.why, /example\.com/);
  assert.equal(r.domain, "example.com");
});

test("an unfamiliar but ordinary domain is not flagged", () => {
  const r = analyzeUrl("https://www.some-small-bakery.example/menu");
  assert.deepEqual(r.indicators, []);
});

test("registrable domain handles common two-part suffixes", () => {
  assert.equal(registrableDomain("a.b.example.co.uk"), "example.co.uk");
  assert.equal(registrableDomain("x.y.example.com"), "example.com");
  assert.equal(registrableDomain("example.in"), "example.in");
});

test("a URL without a scheme is parsed (as text only)", () => {
  const p = parseUrlSafely("www.example.com/path");
  assert.equal(p.ok, true);
  assert.equal(p.hadScheme, false);
});

test("invalid URLs give a friendly error, never an exception", () => {
  for (const bad of ["not a url", "javascript:alert(1)", "ftp://example.com", "http://", "localhost", "<script>"]) {
    const r = triage({ url: bad });
    assert.equal(r.status, "error", bad);
    assert.ok(r.error.length > 5);
  }
});

test("a link inside the message is inspected locally when no URL is given", () => {
  const r = triage({ message: "Pay now: https://bit.ly/abc123" });
  assert.ok(ids(r.indicators).includes("url-shortener"));
  assert.match(r.embeddedUrlNote, /not opened/i);
});

test("URL checking never uses the network", async () => {
  const realFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = () => { called = true; throw new Error("network used"); };
  try {
    triage({ url: "https://bit.ly/x", message: "hello https://example.com" });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(called, false);
});

test("safe next steps always include the core guidance", () => {
  const r = triage({ message: "Hi, lunch at 1?" });
  const joined = r.steps.join(" ");
  assert.match(joined, /Do not share OTPs/);
  assert.match(joined, /Do not transfer money/);
  assert.match(joined, /independently/);
  assert.match(joined, /Do not use contact details or links supplied/);
  assert.ok(r.lossSteps.some((s) => /bank or payment provider/.test(s)));
  assert.ok(r.lossSteps.some((s) => /cybercrime/.test(s)));
  assert.ok(r.lossSteps.some((s) => /screenshots/.test(s)));
});
