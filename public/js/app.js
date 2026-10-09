// ScamShield user interface. Plain JavaScript, no frameworks, no network calls.
// User text is only ever inserted with textContent, never as HTML.

import { triage, maskSensitive } from "./analyzer.js";
import {
  EXAMPLES, QUIZ, SIGN_OPTIONS, CHECKLIST_STEPS, PLATFORMS, CREDENTIAL_OPTIONS, GLOSSARY,
} from "./data.js";
import { REPORTING } from "./config.js";

const MAX_MESSAGE = 5000;
const KEY_PREFS = "scamshield.prefs";
const KEY_SAVED = "scamshield.saved";

// ---------- Local storage (only what the person chooses to keep) ----------
const store = {
  read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

// ---------- Tiny DOM helper ----------
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// replaceChildren() turns null into the text "null", so empty slots are filtered out first.
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));

const $main = document.getElementById("main");
const VIEWS = { check: viewCheck, learn: viewLearn, checklist: viewChecklist, privacy: viewPrivacy };

// ---------- Router ----------
function route(moveFocus = true) {
  const name = (location.hash || "#check").slice(1);
  const view = VIEWS[name] ? name : "check";
  document.querySelectorAll("#tabs a").forEach((a) => {
    if (a.dataset.view === view) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $main.replaceChildren(VIEWS[view]());
  document.title = "ScamShield - " + { check: "Check a message", learn: "Learn", checklist: "Incident checklist", privacy: "Privacy" }[view];
  if (moveFocus) {
    // After the person navigates, move focus to the new page heading. On first load, leave
    // focus alone so the skip link is still the first Tab stop.
    const heading = $main.querySelector("h1");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }
}
window.addEventListener("hashchange", () => route(true));

// ---------- Text size preference ----------
function applyTextSize(size) {
  document.documentElement.dataset.size = size;
  const btn = document.getElementById("text-size");
  btn.setAttribute("aria-pressed", String(size === "large"));
  btn.textContent = size === "large" ? "Normal text" : "Larger text";
}
document.getElementById("text-size").addEventListener("click", () => {
  const next = document.documentElement.dataset.size === "large" ? "normal" : "large";
  applyTextSize(next);
  store.write(KEY_PREFS, { ...store.read(KEY_PREFS, {}), size: next });
});

// =====================================================================
// VIEW 1: CHECK
// =====================================================================
function viewCheck() {
  const msg = h("textarea", {
    id: "msg", maxlength: MAX_MESSAGE, autocomplete: "off", spellcheck: "false",
    "aria-describedby": "msg-hint msg-count",
    placeholder: "Paste the message text here. Use fictional text if you are practising.",
  });
  const count = h("div", { class: "counter", id: "msg-count", "aria-live": "off", text: `0 / ${MAX_MESSAGE}` });
  const url = h("input", {
    id: "url", type: "text", inputmode: "url", autocomplete: "off", spellcheck: "false",
    "aria-describedby": "url-hint", placeholder: "Example: https://example.com/page",
  });
  const errorBox = h("div", { id: "check-error", role: "alert" });
  const out = h("div", { id: "check-result", "aria-live": "polite" });

  msg.addEventListener("input", () => { count.textContent = `${msg.value.length} / ${MAX_MESSAGE}`; });

  function run() {
    errorBox.replaceChildren();
    out.replaceChildren(h("p", { class: "notice notice-info", role: "status", text: "Checking on this device. Nothing is being sent anywhere." }));
    window.setTimeout(() => {
      const result = triage({ message: msg.value, url: url.value });
      out.replaceChildren();
      if (result.status !== "ok") {
        errorBox.replaceChildren(h("p", { class: "field-error", text: result.error }));
        (result.status === "empty" ? msg : (url.value ? url : msg)).focus();
        return;
      }
      out.append(renderResult(result, { message: msg.value, url: url.value }));
      const verdict = out.querySelector(".verdict");
      if (verdict) { verdict.setAttribute("tabindex", "-1"); verdict.focus({ preventScroll: false }); }
    }, 150);
  }

  function reset() {
    msg.value = ""; url.value = "";
    count.textContent = `0 / ${MAX_MESSAGE}`;
    errorBox.replaceChildren(); out.replaceChildren();
    msg.focus();
  }

  function loadSample() {
    const sample = EXAMPLES.find((e) => e.id === "ex-otp");
    msg.value = sample.message; url.value = "";
    count.textContent = `${msg.value.length} / ${MAX_MESSAGE}`;
    errorBox.replaceChildren(); out.replaceChildren();
    msg.focus();
  }

  return h("section", {},
    h("h1", { text: "Check a suspicious message or link" }),
    h("p", { class: "lead", text: "Paste a message, a link, or both. ScamShield looks for common warning signs and explains each one in plain English." }),
    h("div", { class: "card" },
      h("form", { onsubmit: (e) => { e.preventDefault(); run(); }, novalidate: true },
        h("label", { for: "msg" }, "Message text",
          h("span", { class: "hint", id: "msg-hint", text: "Optional if you enter a link. Do not paste passwords, OTPs, PINs or card numbers." })),
        msg, count,
        h("label", { for: "url" }, "Link (web address)",
          h("span", { class: "hint", id: "url-hint", text: "Optional. The link is read as text only. ScamShield never opens it." })),
        url,
        errorBox,
        h("div", { class: "btn-row" },
          h("button", { class: "btn", type: "submit" }, "Check on this device"),
          h("button", { class: "btn btn-secondary", type: "button", onclick: reset }, "Clear everything"),
          h("button", { class: "btn btn-secondary", type: "button", onclick: loadSample }, "Try a fictional sample"))
      )),
    out
  );
}

function renderResult(result, inputs) {
  const frag = h("div");

  frag.append(
    h("div", { class: `verdict ${result.level}` },
      h("div", { class: "tag", text: "Triage guidance, not a verdict" }),
      h("h2", { text: result.label }),
      h("p", { text: levelSentence(result) })
    )
  );

  if (result.urlProblem) frag.append(h("p", { class: "notice notice-warn", text: "Link not checked: " + result.urlProblem }));
  if (result.embeddedUrlNote) frag.append(h("p", { class: "notice notice-info", text: result.embeddedUrlNote }));

  frag.append(h("h2", { text: result.indicators.length ? "Warning signs found" : "Warning signs" }));
  if (!result.indicators.length) {
    frag.append(h("div", { class: "card" },
      h("p", { text: "No obvious warning signs were found in what you entered. That does not mean it is safe." }),
      h("p", { class: "muted", text: "Scams can use ordinary words. If you were not expecting this message, or it asks for money or personal details, verify it through an official channel that you find yourself." })));
  }
  for (const i of result.indicators) {
    frag.append(h("article", { class: `card indicator sev-${i.severity}` },
      h("h3", {}, i.name, h("span", { class: "sev", text: { high: "Strong sign", medium: "Moderate sign", low: "Minor sign" }[i.severity] })),
      h("span", { class: "evidence", "aria-label": "Matched text", text: i.evidence }),
      h("dl", { class: "dl" },
        h("dt", { text: "Why this matters" }), h("dd", { text: i.why }),
        h("dt", { text: "What you can do" }), h("dd", { text: i.action }))
    ));
  }

  frag.append(h("h2", { text: "Safe next steps" }),
    h("div", { class: "card" }, h("ol", { class: "steps" }, result.steps.map((s) => h("li", { text: s })))));

  frag.append(h("h2", { text: "If money or codes were already shared" }),
    h("div", { class: "card" },
      h("p", { text: "Many people are caught out by convincing scams. It is not your fault, and acting early helps. No one can promise that lost money will be recovered." }),
      h("ul", { class: "steps" }, result.lossSteps.map((s) => h("li", { text: s }))),
      h("p", {}, h("a", { href: "#checklist" }, "Prepare an incident summary on this device"))));

  frag.append(h("p", { class: "notice notice-warn", role: "note" }, h("strong", { text: "Please remember: " }), result.disclaimer));

  // Explicit, optional local save
  const saveMsg = h("div", { role: "status", "aria-live": "polite" });
  if (inputs.message.trim()) {
    frag.append(h("div", { class: "card" },
      h("h3", { text: "Keep this as a practice example?" }),
      h("p", { class: "muted small", text: "Optional. It is saved only in this browser on this device. Long number strings are hidden before saving. You can delete it any time in the Learn tab." }),
      h("button", { class: "btn btn-secondary", type: "button", onclick: () => saveExample(inputs, saveMsg) }, "Save to this device"),
      saveMsg));
  }
  return frag;
}

function levelSentence(result) {
  if (result.level === "high") return "Several strong or combined warning signs were found. Treat this with caution and verify it independently before doing anything it asks.";
  if (result.level === "review") return "Some warning signs were found. Take a moment and check with the organisation using official contact details you find yourself.";
  return "Nothing matched ScamShield's rules. A scam can still be present, so stay careful, especially if money or personal details are involved.";
}

function saveExample(inputs, statusEl) {
  const saved = store.read(KEY_SAVED, []);
  const entry = {
    id: "s" + Date.now().toString(36),
    savedAt: new Date().toISOString(),
    message: maskSensitive(inputs.message).slice(0, MAX_MESSAGE),
    url: inputs.url.trim().slice(0, 500),
  };
  saved.unshift(entry);
  const ok = store.write(KEY_SAVED, saved.slice(0, 20));
  statusEl.replaceChildren(h("p", { class: ok ? "notice notice-ok" : "notice notice-error",
    text: ok ? "Saved on this device. See it under Learn, then Your saved examples." : "Your browser did not allow saving, so nothing was kept." }));
}

// =====================================================================
// VIEW 2: LEARN (examples, quiz, saved, glossary)
// =====================================================================
function viewLearn() {
  const detail = h("div", { id: "example-detail", "aria-live": "polite" });
  const grid = h("div", { class: "grid" });
  const cards = [];

  EXAMPLES.forEach((ex) => {
    const btn = h("button", { class: "example-open", type: "button", "aria-controls": "example-detail",
      onclick: () => openExample(ex, card, detail, cards) },
      h("div", {}, h("span", { class: "badge", text: "Fictional example" })),
      h("h3", { text: ex.title }),
      h("div", { class: "pill", text: ex.category }));
    const card = h("div", { class: "card example-card" }, btn);
    cards.push(card);
    grid.append(card);
  });

  return h("section", {},
    h("h1", { text: "Learn how common scams work" }),
    h("p", { class: "lead", text: "Open an example, try to spot the warning signs, then reveal the explanation. Every example is fictional and made for education only." }),
    h("h2", { text: "Spot the signs" }),
    grid, detail,
    h("h2", { id: "quiz-title", text: "Quick quiz" }),
    renderQuiz(),
    h("h2", { text: "Your saved examples" }),
    renderSaved(),
    h("h2", { text: "Plain-English glossary" }),
    h("div", { class: "card" }, h("dl", { class: "dl" }, GLOSSARY.map(([t, d]) => [h("dt", { text: t }), h("dd", { text: d })]).flat()))
  );
}

function openExample(ex, card, detail, cards) {
  cards.forEach((c) => c.removeAttribute("data-active"));
  card.dataset.active = "true";
  const result = h("div", { "aria-live": "polite" });
  const boxes = SIGN_OPTIONS.map((o) => {
    const id = `sign-${ex.id}-${o.id}`;
    return h("div", { class: "check-row" },
      h("input", { type: "checkbox", id, value: o.id }),
      h("label", { for: id, text: o.label }));
  });
  const reveal = h("button", { class: "btn", type: "button", onclick: () => doReveal(ex, boxes, result) }, "Reveal explanation");

  detail.replaceChildren(h("article", { class: "card", "aria-labelledby": "ex-title" },
    h("span", { class: "badge", text: "Fictional example. For education only." }),
    h("h3", { id: "ex-title", text: `${ex.category}: ${ex.title}` }),
    h("div", { class: "message-box", text: ex.message }),
    h("fieldset", {}, h("legend", { class: "label", text: "Which warning signs can you spot?" }), boxes),
    h("div", { class: "btn-row" }, reveal),
    result));
  detail.querySelector("h3").setAttribute("tabindex", "-1");
  detail.querySelector("h3").focus();
}

function doReveal(ex, boxes, resultEl) {
  const chosen = new Set(boxes.map((b) => b.querySelector("input")).filter((i) => i.checked).map((i) => i.value));
  const expected = new Set(ex.expected);
  const found = [...expected].filter((id) => chosen.has(id));
  const missed = [...expected].filter((id) => !chosen.has(id));
  const extra = [...chosen].filter((id) => !expected.has(id));
  const label = (id) => SIGN_OPTIONS.find((o) => o.id === id)?.label || id;
  const analysis = triage({ message: ex.message });
  const byId = new Map(analysis.indicators.map((i) => [i.id, i]));

  fill(resultEl,
    h("div", { class: "notice notice-info", role: "status" },
      h("strong", { text: `You spotted ${found.length} of ${expected.size} main warning signs.` }),
      h("span", { text: chosen.size ? " Nice work either way. Spotting signs gets easier with practice." : " No problem. Here is what to look for." })),
    h("h3", { text: "Main warning signs in this example" }),
    ...[...expected].map((id) => {
      const ind = byId.get(id);
      return h("div", { class: "card indicator sev-" + (ind ? ind.severity : "low") },
        h("strong", { text: (found.includes(id) ? "Spotted: " : "Missed: ") + label(id) }),
        ind ? h("span", { class: "evidence", text: ind.evidence }) : null,
        ind ? h("p", { text: ind.why }) : null);
    }),
    extra.length ? h("p", { class: "muted", text: "Also selected: " + extra.map(label).join("; ") + ". These were not the main signs in this example, but it is good to stay alert." }) : null,
    h("div", { class: "notice notice-ok" }, h("strong", { text: "Key lesson: " }), ex.lesson),
    h("p", { class: "muted small", text: "Safe next step: do not reply or click. Verify through an official channel you find yourself." })
  );
}

function renderQuiz() {
  const box = h("div", { class: "card", id: "quiz" });
  let idx = 0; let score = 0;

  function show() {
    if (idx >= QUIZ.length) return finish();
    const q = QUIZ[idx];
    const feedback = h("div", { role: "status", "aria-live": "polite" });
    const next = h("button", { class: "btn", type: "button", hidden: true,
      onclick: () => { idx += 1; show(); } }, idx === QUIZ.length - 1 ? "See my result" : "Next question");
    const opts = q.options.map((text, i) => {
      const b = h("button", { class: "option-btn", type: "button", text });
      b.addEventListener("click", () => {
        const right = i === q.answer;
        if (right) score += 1;
        opts.forEach((o, j) => {
          o.disabled = true;
          if (j === q.answer) o.classList.add("correct");
          else if (j === i) o.classList.add("wrong");
        });
        b.setAttribute("aria-label", text + (right ? " (your answer, correct)" : " (your answer, not quite)"));
        feedback.replaceChildren(h("p", { class: right ? "notice notice-ok" : "notice notice-warn" },
          h("strong", { text: right ? "Correct. " : "Not quite. " }), q.why));
        next.hidden = false; next.focus();
      });
      return b;
    });
    box.replaceChildren(
      h("div", { class: "small muted", text: `Question ${idx + 1} of ${QUIZ.length}` }),
      h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(QUIZ.length), "aria-valuenow": String(idx), "aria-label": "Quiz progress" },
        h("span", { class: `w-${idx}` })),
      h("h3", { text: q.q }), ...opts, feedback, h("div", { class: "btn-row" }, next));
    box.querySelector(".progress > span").style.width = `${(idx / QUIZ.length) * 100}%`;
  }

  function finish() {
    box.replaceChildren(
      h("h3", { text: `You answered ${score} of ${QUIZ.length} correctly.` }),
      h("p", { text: "This quiz is for practice. Your score is not saved or sent anywhere." }),
      h("div", { class: "btn-row" }, h("button", { class: "btn", type: "button", onclick: () => { idx = 0; score = 0; show(); } }, "Try again")));
  }

  box.replaceChildren(
    h("p", { text: `${QUIZ.length} short questions with instant feedback.` }),
    h("button", { class: "btn", type: "button", onclick: show }, "Start the quiz"));
  return box;
}

function renderSaved() {
  const wrap = h("div");
  function draw() {
    const saved = store.read(KEY_SAVED, []);
    wrap.replaceChildren();
    if (!saved.length) {
      wrap.append(h("div", { class: "card" }, h("p", { class: "muted", text: "Nothing saved yet. After you check a message you can choose to keep it here as a practice example. Nothing is saved unless you choose it." })));
      return;
    }
    saved.forEach((s) => {
      wrap.append(h("div", { class: "card" },
        h("span", { class: "badge", text: "Saved on this device" }),
        h("div", { class: "message-box", text: s.message || "(link only)" }),
        s.url ? h("p", { class: "small muted", text: "Link: " + s.url }) : null,
        h("p", { class: "small muted", text: "Saved " + new Date(s.savedAt).toLocaleString() }),
        h("button", { class: "btn btn-danger", type: "button", onclick: () => {
          store.write(KEY_SAVED, store.read(KEY_SAVED, []).filter((x) => x.id !== s.id)); draw();
        } }, "Delete")));
    });
  }
  draw();
  return wrap;
}

// =====================================================================
// VIEW 3: INCIDENT CHECKLIST (all local; nothing is submitted)
// =====================================================================
function sanitizeForSummary(text) {
  let flagged = false;
  let out = String(text || "");
  out = out.replace(/\b(?:\d[ -]?){13,19}\b/g, () => { flagged = true; return "[number removed]"; });
  out = out.replace(/\b(otp|pin|password|passcode|cvv)\b\s*(is|:|=)\s*\S+/gi, (_, w) => { flagged = true; return `${w} [removed]`; });
  return { text: out, flagged };
}

function viewChecklist() {
  const what = h("textarea", { id: "inc-what", maxlength: 1500, "aria-describedby": "inc-what-hint", placeholder: "Example: I received a message saying my parcel was held and I tapped a link." });
  const when = h("input", { id: "inc-when", type: "datetime-local" });
  const platform = h("select", { id: "inc-platform" }, h("option", { value: "", text: "Choose one" }), PLATFORMS.map((p) => h("option", { value: p, text: p })));
  const money = h("select", { id: "inc-money" },
    h("option", { value: "No money sent", text: "No" }),
    h("option", { value: "Money was sent", text: "Yes" }),
    h("option", { value: "Not sure", text: "Not sure" }));
  const amount = h("input", { id: "inc-amount", type: "text", maxlength: 40, autocomplete: "off", placeholder: "Approximate amount, if you wish" });
  const sender = h("input", { id: "inc-sender", type: "text", maxlength: 200, autocomplete: "off", placeholder: "Phone number, email, username or website that contacted you" });
  const warn = h("div", { id: "inc-warn", role: "alert" });
  const preview = h("pre", { class: "summary", id: "inc-preview", tabindex: "0", "aria-label": "Incident summary preview" });
  const status = h("div", { role: "status", "aria-live": "polite" });

  const credChecks = CREDENTIAL_OPTIONS.map((o) =>
    h("div", { class: "check-row" }, h("input", { type: "checkbox", id: "cred-" + o.id, value: o.id }), h("label", { for: "cred-" + o.id, text: o.label })));
  const stepChecks = CHECKLIST_STEPS.map((s) =>
    h("div", { class: "check-row" }, h("input", { type: "checkbox", id: "step-" + s.id, value: s.id }), h("label", { for: "step-" + s.id, text: s.label })));

  function build() {
    let flagged = false;
    const clean = (v) => { const r = sanitizeForSummary(v); flagged = flagged || r.flagged; return r.text.trim(); };
    const credLabels = credChecks.map((c) => c.querySelector("input")).filter((i) => i.checked && i.value !== "none")
      .map((i) => CREDENTIAL_OPTIONS.find((o) => o.id === i.value).label);
    const noneChecked = credChecks.some((c) => { const i = c.querySelector("input"); return i.value === "none" && i.checked; });
    const done = CHECKLIST_STEPS.filter((s) => stepChecks.some((c) => { const i = c.querySelector("input"); return i.value === s.id && i.checked; }));
    const todo = CHECKLIST_STEPS.filter((s) => !done.includes(s));
    const whenText = when.value ? new Date(when.value).toLocaleString() : "Not given";

    const lines = [
      "INCIDENT SUMMARY",
      "Prepared on my own device. It has not been sent to anyone and is not an official complaint.",
      "Prepared: " + new Date().toLocaleString(),
      "",
      "What happened: " + (clean(what.value) || "Not given"),
      "Approximate time: " + whenText,
      "Where it happened: " + (platform.value || "Not given"),
      "Money: " + money.value + (amount.value.trim() ? " (approx. " + clean(amount.value) + ")" : ""),
      "Shared with the other party: " + (credLabels.length ? credLabels.join("; ") : noneChecked ? "None of the listed items" : "Not given"),
      "Sender details: " + (clean(sender.value) || "Not given"),
      "",
      "Steps I have taken:",
      ...(done.length ? done.map((s) => "  [x] " + s.label) : ["  (none yet)"]),
      "Steps still to do:",
      ...(todo.length ? todo.map((s) => "  [ ] " + s.label) : ["  (none)"]),
      "",
      "Official reporting for: " + REPORTING.jurisdiction,
      ...REPORTING.steps.map((s) => "  - " + s),
      REPORTING.helpline ? "  Helpline: " + REPORTING.helpline : null,
      REPORTING.officialPortalUrl ? `  ${REPORTING.officialPortalLabel || "Official portal"}: ${REPORTING.officialPortalUrl}` : null,
    ].filter((l) => l !== null);

    fill(warn, flagged ? h("p", { class: "notice notice-warn", text: "Part of your text looked like a card number or a secret code, so it was hidden in the summary. Please do not type secrets here." }) : null);
    return lines.join("\n");
  }

  function refresh() { preview.textContent = build(); }
  [what, when, platform, money, amount, sender, ...credChecks, ...stepChecks].forEach((el) => {
    el.addEventListener("input", refresh); el.addEventListener("change", refresh);
  });

  async function copy() {
    const text = build();
    try {
      await navigator.clipboard.writeText(text);
      status.replaceChildren(h("p", { class: "notice notice-ok", text: "Copied. It stays on your device until you paste it somewhere yourself." }));
    } catch {
      const range = document.createRange(); range.selectNodeContents(preview);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      status.replaceChildren(h("p", { class: "notice notice-warn", text: "Automatic copy was not available. The summary is selected, so press Ctrl+C (or Command+C) to copy it." }));
    }
  }

  function download() {
    const blob = new Blob([build()], { type: "text/plain" });
    const a = h("a", { href: URL.createObjectURL(blob), download: "scamshield-incident-summary.txt" });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status.replaceChildren(h("p", { class: "notice notice-ok", text: "A text file was created on your device. Nothing was uploaded." }));
  }

  function reset() {
    [what, when, amount, sender].forEach((e) => { e.value = ""; });
    platform.value = ""; money.value = "No money sent";
    [...credChecks, ...stepChecks].forEach((c) => { c.querySelector("input").checked = false; });
    status.replaceChildren(); refresh(); what.focus();
  }

  refresh();

  return h("section", {},
    h("h1", { text: "Incident preparation checklist" }),
    h("p", { class: "lead", text: "If you think you may have been scammed, this page helps you gather what happened in one place. Being targeted does not mean you did anything wrong." }),
    h("p", { class: "notice notice-info" }, h("strong", { text: "Private by design: " }), "what you type here is not sent to any server and is not saved. Reloading the page clears it. ScamShield does not file complaints. Use the summary when you contact your bank or the official reporting channel."),
    h("div", { class: "two-col" },
      h("div", { class: "card" },
        h("label", { for: "inc-what" }, "What happened?", h("span", { class: "hint", id: "inc-what-hint", text: "Short and factual. Do not include passwords, OTPs, PINs or card numbers." })),
        what,
        h("label", { for: "inc-when" }, "Approximate date and time"), when,
        h("label", { for: "inc-platform" }, "Where did it happen?"), platform,
        h("label", { for: "inc-money" }, "Was money sent?"), money,
        h("label", { for: "inc-amount" }, "Approximate amount (optional)"), amount,
        h("fieldset", {}, h("legend", { class: "label", text: "Did you share any of these with the other party?" }), credChecks),
        h("label", { for: "inc-sender" }, "Sender details (optional)", h("span", { class: "hint", text: "Public details only, such as a phone number or website address." })), sender,
        h("fieldset", {}, h("legend", { class: "label", text: "Steps checklist" }), stepChecks),
        warn),
      h("div", {},
        h("h2", { text: "Your summary", class: "no-top" }),
        preview,
        h("div", { class: "btn-row" },
          h("button", { class: "btn", type: "button", onclick: copy }, "Copy summary"),
          h("button", { class: "btn btn-secondary", type: "button", onclick: download }, "Download as text file"),
          h("button", { class: "btn btn-danger", type: "button", onclick: reset }, "Clear everything")),
        status,
        h("div", { class: "card" },
          h("h3", { text: "Official reporting" }),
          h("p", { class: "small muted", text: "Location: " + REPORTING.jurisdiction + (REPORTING.jurisdiction.includes("not configured") ? ". An administrator should set verified local details in config.js." : "") }),
          h("ul", { class: "steps" }, REPORTING.steps.map((s) => h("li", { text: s }))),
          REPORTING.helpline ? h("p", { text: "Helpline: " + REPORTING.helpline }) : null,
          REPORTING.officialPortalUrl ? h("p", {}, h("a", { href: REPORTING.officialPortalUrl, rel: "noopener noreferrer" }, REPORTING.officialPortalLabel || "Official portal")) : null,
          h("p", { class: "small muted", text: "ScamShield cannot guarantee that lost money can be recovered." })))
    )
  );
}

// =====================================================================
// VIEW 4: PRIVACY & LIMITS
// =====================================================================
function viewPrivacy() {
  const status = h("div", { role: "status", "aria-live": "polite" });
  const savedCount = store.read(KEY_SAVED, []).length;
  const prefs = store.read(KEY_PREFS, {});

  return h("section", {},
    h("h1", { text: "Privacy, safety and limits" }),
    h("p", { class: "lead", text: "ScamShield is built to work without collecting anything about you." }),
    h("h2", { text: "What happens to what you type" }),
    h("div", { class: "card" }, h("ul", { class: "steps" },
      h("li", { text: "Checks run in your browser. Messages and links are not sent to any server or third party." }),
      h("li", { text: "Links are only read as text. ScamShield never opens or visits them." }),
      h("li", { text: "Nothing you type is saved unless you press a save button. The only things that can be saved on this device are your text-size choice and examples you choose to keep." }),
      h("li", { text: "The incident checklist is never saved. Reloading the page clears it." }),
      h("li", { text: "There are no accounts, no analytics and no advertising." }))),
    h("h2", { text: "What is stored on this device right now" }),
    h("div", { class: "card" },
      h("p", { text: `Saved examples: ${savedCount}` }),
      h("p", { text: `Text size choice: ${prefs.size === "large" ? "Larger text" : "Normal (default)"}` }),
      h("button", { class: "btn btn-danger", type: "button", onclick: () => {
        store.remove(KEY_SAVED); store.remove(KEY_PREFS); applyTextSize("normal");
        status.replaceChildren(h("p", { class: "notice notice-ok", text: "All ScamShield data on this device was deleted." }));
      } }, "Delete everything ScamShield stored on this device"),
      status),
    h("h2", { text: "Limits you should know about" }),
    h("div", { class: "card" }, h("ul", { class: "steps" },
      h("li", { text: "ScamShield uses a fixed set of simple rules. It is a learning aid, not a fraud detector." }),
      h("li", { text: "A message can be dangerous without matching any rule. Real messages can match some rules." }),
      h("li", { text: "The result is not a percentage or a probability. It is a prompt to slow down and verify." }),
      h("li", { text: "Link checks look only at how the address is written. An unfamiliar domain is not automatically harmful, and a normal-looking one is not automatically safe." }),
      h("li", { text: "The rules were written for English text. They may miss scams written in other styles." }),
      h("li", { text: "ScamShield does not replace your bank, the police or official reporting channels." }))),
    h("h2", { text: "Always remember" }),
    h("div", { class: "card" }, h("ul", { class: "steps" },
      h("li", { text: "Never share OTPs, PINs, passwords, recovery codes or remote-access permissions." }),
      h("li", { text: "Verify using contact details you find yourself, never the ones in the message." }),
      h("li", { text: "Anyone can be targeted. If it happens to you, you are not alone." })))
  );
}

// ---------- Start ----------
applyTextSize(store.read(KEY_PREFS, {}).size === "large" ? "large" : "normal");
route(false);
