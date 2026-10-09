// Builds the 7-slide ScamShield presentation from the real prototype screenshots.
// Needs pptxgenjs, sharp, react, react-dom and react-icons (not project dependencies).
// Usage: NODE_PATH=/path/to/node_modules node scripts/build-deck.cjs
// Run `node scripts/screenshots.mjs` first so docs/screenshots/*.png exist.

const path = require("path");
const fs = require("fs");
const os = require("os");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.APPLY_THEME || "/mnt/skills/public/pptx/scripts/apply_theme.js");

const ROOT = path.join(__dirname, "..");
const SHOTS = path.join(ROOT, "docs", "screenshots");
const TMP = fs.mkdtempSync(path.join(process.env.DECK_TMP || os.tmpdir(), "deck-"));
const OUT = path.join(ROOT, "docs", "ScamShield_Presentation.pptx");

const THEME = {
  name: "ScamShield",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14232E", lt1: "FFFFFF", dk2: "0B3D5C", lt2: "EAF1F6",
    accent1: "0A6E5D", // teal: icons and primary accents
    accent2: "9A5B00", // amber: moderate signs
    accent3: "B3261E", // red: strong signs
    accent4: "1F5F8B", // blue: minor signs
    accent5: "5A6B79", // muted grey text
    accent6: "6B4C9A",
    hlink: "0050C8", folHlink: "5B3FA0",
  },
};

async function icon(name, hex) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex, size: "256" }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function crop(src, name, ratio, top = 0) {
  const meta = await sharp(path.join(SHOTS, src)).metadata();
  const h = Math.round(meta.width / ratio);
  const file = path.join(TMP, name);
  await sharp(path.join(SHOTS, src)).extract({ left: 0, top, width: meta.width, height: Math.min(h, meta.height - top) }).png().toBuffer().then((b) => fs.writeFileSync(file, b));
  return file;
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
  pres.title = "ScamShield - Digital Fraud Awareness for Everyone";
  pres.author = "ScamShield team";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- Layouts ----------
  const footerText = "ScamShield  |  All examples are fictional and for education only";
  pres.defineSlideMaster({
    title: "TITLE_DARK",
    background: { color: C.text2 },
    objects: [],
    slideNumber: undefined,
  });
  pres.defineSlideMaster({
    title: "CONTENT_LIGHT",
    background: { color: C.background1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75, fontSize: 34, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
      { text: { text: footerText, options: { x: 0.5, y: 5.27, w: 7, h: 0.22, fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 9.0, y: 5.27, w: 0.5, h: 0.22, fontSize: 10, color: C.accent5, align: "right" },
  });
  pres.defineSlideMaster({
    title: "CONTENT_DARK",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75, fontSize: 34, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
      { text: { text: footerText, options: { x: 0.5, y: 5.27, w: 7, h: 0.22, fontSize: 10, color: C.background2, margin: 0 } } },
    ],
    slideNumber: { x: 9.0, y: 5.27, w: 0.5, h: 0.22, fontSize: 10, color: C.background2, align: "right" },
  });
  pres.defineSlideMaster({
    title: "TITLE_DARK_FILL",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.35, w: 5.9, h: 1.0, fontSize: 56, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    ],
  });

  // ---------- Helpers ----------
  const txt = (slide, text, o) => slide.addText(text, { isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 14, ...o });
  const card = (slide, x, y, w, h, fill, extra = {}) =>
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill, ...(extra.transparency ? { transparency: extra.transparency } : {}) }, line: extra.line || { type: "none" } });
  const badge = async (slide, x, y, d, fill, name, hex = "FFFFFF") => {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    const pad = d * 0.25;
    slide.addImage({ data: await icon(name, hex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: "" });
  };

  // ================= Slide 1: Title =================
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "TITLE_DARK_FILL", sectionTitle: "Opening" });
  await badge(s, 0.6, 0.55, 0.65, C.accent1, "FaShieldAlt");
  txt(s, "HACK FOR SOCIAL CAUSE  |  VBYLD 2027", { x: 1.45, y: 0.62, w: 5, h: 0.5, fontSize: 12, bold: true, color: C.background2, charSpacing: 2, valign: "middle" });
  s.addText("ScamShield", { placeholder: "title" });
  txt(s, "Digital Fraud Awareness for Everyone", { x: 0.6, y: 2.45, w: 5.9, h: 0.5, fontSize: 24, color: C.background2, fontFace: THEME.headFontFace });
  txt(s, "Spot suspicious messages and links, learn how common scams work, and prepare safer next steps. Everything runs on your own device.", { x: 0.6, y: 3.15, w: 5.6, h: 0.9, fontSize: 16, color: C.background1 });
  const chipX = [0.6, 1.75, 2.9];
  ["SDG 9", "SDG 10", "SDG 16"].forEach((t, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: chipX[i], y: 4.3, w: 1.0, h: 0.38, rectRadius: 0.19, fill: { color: C.accent1 }, line: { type: "none" } });
    txt(s, t, { x: chipX[i], y: 4.3, w: 1.0, h: 0.38, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
  });
  txt(s, "Theme: Digital Safety and Cyber Fraud Awareness", { x: 0.6, y: 4.85, w: 5.6, h: 0.3, fontSize: 12, color: C.background2 });
  card(s, 6.95, 0.42, 2.34, 4.7, C.background1);
  s.addImage({ path: path.join(SHOTS, "check-mobile.png"), x: 7.02, y: 0.49, w: 2.2, h: 4.56, sizing: { type: "cover", w: 2.2, h: 4.56 }, altText: "Real phone-size screenshot of ScamShield showing a High caution result for a fictional message" });
  txt(s, "Real screenshot of the prototype", { x: 6.5, y: 5.22, w: 2.8, h: 0.22, fontSize: 10, color: C.background2, align: "right" });
  s.addNotes("Open with the problem in one sentence: scam messages are designed to rush people, and most people have never been shown what the warning signs look like. ScamShield is a small, private learning tool. Everything on this deck reflects what is actually built. The screenshot is a real capture of the prototype running on a phone-sized screen, using a fictional message.");

  // ================= Slide 2: Problem =================
  pres.addSection({ title: "Problem and solution" });
  s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Problem and solution" });
  s.addText("Scams are built to rush people", { placeholder: "title" });
  const patterns = [
    ["FaUniversity", "Account will be blocked"],
    ["FaBox", "Parcel fee link"],
    ["FaBriefcase", "Job registration fee"],
    ["FaKey", "OTP or remote access"],
    ["FaChartLine", "Guaranteed returns"],
    ["FaUserFriends", "Family in trouble"],
  ];
  for (let i = 0; i < patterns.length; i++) {
    const x = 0.5 + (i % 2) * 2.8;
    const y = 1.25 + Math.floor(i / 2) * 1.32;
    card(s, x, y, 2.6, 1.12, C.background2);
    await badge(s, x + 0.2, y + 0.26, 0.6, C.accent1, patterns[i][0]);
    txt(s, patterns[i][1], { x: x + 0.95, y: y + 0.1, w: 1.55, h: 0.92, fontSize: 14, bold: true, valign: "middle" });
  }
  card(s, 6.2, 1.25, 3.3, 3.76, C.background2);
  txt(s, "The gap", { x: 6.4, y: 1.4, w: 2.9, h: 0.3, fontSize: 16, bold: true, color: C.text2 });
  txt(s, [
    { text: "Warning signs are hard to see under pressure", options: { bullet: true, breakLine: true } },
    { text: "Evidence and next steps are unclear", options: { bullet: true, breakLine: true } },
    { text: "Advice is full of technical words", options: { bullet: true } },
  ], { x: 6.4, y: 1.75, w: 2.95, h: 1.55, paraSpaceAfter: 4 });
  txt(s, "Who it helps", { x: 6.4, y: 3.3, w: 2.9, h: 0.3, fontSize: 16, bold: true, color: C.text2 });
  txt(s, [
    { text: "Students and first-time payment users", options: { bullet: true, breakLine: true } },
    { text: "Older adults", options: { bullet: true, breakLine: true } },
    { text: "Community trainers", options: { bullet: true } },
  ], { x: 6.4, y: 3.65, w: 2.95, h: 1.3, paraSpaceAfter: 4 });
  s.addNotes("These are the six patterns the brief highlights: blocked-account threats, parcel fees, job fees, OTP and remote-access requests, guaranteed returns and family-emergency messages. The common thread is pressure. People may not know which parts of a message to question, how to keep evidence, or what a safe next step is, and most advice uses technical terms. We are not quoting statistics in this deck. ScamShield targets understanding and confidence, not detection.");

  // ================= Slide 3: Solution + workflow =================
  s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Problem and solution" });
  s.addText("How ScamShield helps", { placeholder: "title" });
  const steps = ["Paste a message or link", "Checked on your device", "Read the warning signs", "Follow safe next steps", "Learn or prepare a summary"];
  for (let i = 0; i < steps.length; i++) {
    const x = 0.5 + i * 1.85;
    card(s, x, 1.2, 1.6, 0.95, C.text2);
    txt(s, [
      { text: String(i + 1), options: { bold: true, fontSize: 14, color: C.background2, breakLine: true } },
      { text: steps[i], options: { fontSize: 14, color: C.background1, bold: true } },
    ], { x: x + 0.12, y: 1.27, w: 1.38, h: 0.82 });
    if (i < steps.length - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 1.64, y: 1.56, w: 0.17, h: 0.22, fill: { color: C.accent1 }, line: { type: "none" } });
  }
  const mods = [
    ["Check", "Paste text or a link. See each warning sign and why it matters.", await crop("check-signs.png", "t-check.png", 2.0)],
    ["Learn", "9 fictional examples and a 7-question quiz with instant feedback.", await crop("learn-example.png", "t-learn.png", 2.0)],
    ["Checklist", "Prepare a private summary to copy or download.", await crop("checklist.png", "t-checklist.png", 2.0, 690)],
  ];
  mods.forEach((m, i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 2.45, 2.9, 2.6, C.background2);
    s.addImage({ path: m[2], x: x + 0.1, y: 2.55, w: 2.7, h: 1.35, altText: `Real screenshot of the ${m[0]} screen` });
    txt(s, m[0], { x: x + 0.15, y: 3.98, w: 2.6, h: 0.3, fontSize: 16, bold: true, color: C.text2 });
    txt(s, m[1], { x: x + 0.15, y: 4.28, w: 2.6, h: 0.7, fontSize: 14 });
  });
  s.addNotes("This is the user workflow in five steps. The three tools share one idea: slow the person down and explain. Check explains a message or link. Learn builds the skill using fictional examples. Checklist helps someone who thinks they have been scammed gather facts for their bank or the official reporting channel. The thumbnails are real captures of each screen.");

  // ================= Slide 4: Walkthrough =================
  pres.addSection({ title: "Product" });
  s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Product" });
  s.addText("Every warning sign is explained", { placeholder: "title" });
  card(s, 0.5, 1.25, 4.4, 1.8, C.background2);
  txt(s, "FICTIONAL EXAMPLE, FOR EDUCATION ONLY", { x: 0.7, y: 1.37, w: 4.0, h: 0.22, fontSize: 11, bold: true, color: C.accent1 });
  const strong = { color: C.accent3, bold: true, highlight: "FDECEB" };
  const mod = { color: C.accent2, bold: true, highlight: "FFF4DE" };
  const minor = { color: C.accent4, bold: true, highlight: "E3EEF6" };
  txt(s, [
    { text: "This is the " },
    { text: "fraud team from your bank", options: minor },
    { text: ". We noticed a suspicious payment. " },
    { text: "Share the OTP", options: strong },
    { text: " you just received to cancel it. " },
    { text: "Your card will be blocked", options: mod },
    { text: ". " },
    { text: "Reply immediately", options: mod },
    { text: "." },
  ], { x: 0.7, y: 1.68, w: 4.0, h: 1.3, fontSize: 15, lineSpacingMultiple: 1.05 });
  [["Strong sign", C.accent3], ["Moderate", C.accent2], ["Minor", C.accent4]].forEach((l, i) => {
    const x = 0.5 + i * 1.5;
    s.addShape(pres.shapes.OVAL, { x, y: 3.27, w: 0.16, h: 0.16, fill: { color: l[1] }, line: { type: "none" } });
    txt(s, l[0], { x: x + 0.24, y: 3.22, w: 1.2, h: 0.26, fontSize: 12, valign: "middle" });
  });
  card(s, 0.5, 3.6, 4.4, 1.45, C.text2);
  txt(s, [
    { text: "Then it shows safe next steps", options: { bold: true, breakLine: true } },
    { text: "Do not share the code", options: { bullet: true, breakLine: true } },
    { text: "Verify using a number you find yourself", options: { bullet: true, breakLine: true } },
    { text: "If money was sent, contact your bank", options: { bullet: true } },
  ], { x: 0.7, y: 3.72, w: 4.0, h: 1.25, color: C.background1, fontSize: 14, paraSpaceAfter: 3 });
  s.addImage({ path: path.join(SHOTS, "check-signs.png"), x: 5.15, y: 1.25, w: 4.2, h: 4.2 * (1614 / 1856), altText: "Real screenshot: High caution label with matched evidence, why it matters and what you can do" });
  txt(s, "Real screenshot of the prototype. The label is triage guidance, not a verdict.", { x: 5.15, y: 4.98, w: 4.35, h: 0.2, fontSize: 10, color: C.accent5 });
  s.addNotes("Demo moment. Paste the fictional bank message. ScamShield shows the label High caution, tagged as triage guidance, not a verdict. Each warning sign shows the matched text, a plain-English reason and a suggested action. Colors are paired with the words Strong, Moderate or Minor so meaning never depends on color alone. Below the signs, it lists safe next steps and what to do if money or codes were already shared. A low-risk result always carries a reminder that it does not prove a message is legitimate.");

  // ================= Slide 5: Architecture + privacy =================
  s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Product" });
  s.addText("Private by design", { placeholder: "title" });
  // Static server
  card(s, 0.5, 1.2, 5.2, 0.42, C.background2);
  txt(s, "Static file server: sends the app files, receives nothing", { x: 0.65, y: 1.2, w: 4.9, h: 0.42, fontSize: 12, bold: true, color: C.text2, valign: "middle" });
  s.addShape(pres.shapes.LINE, { x: 3.1, y: 1.64, w: 0, h: 0.2, line: { color: C.accent5, width: 1.5, endArrowType: "triangle" } });
  // Device boundary
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.88, w: 5.2, h: 3.17, rectRadius: 0.12, fill: { color: C.background1 }, line: { color: C.accent1, width: 2, dashType: "dash" } });
  txt(s, "YOUR DEVICE: every check runs here", { x: 0.7, y: 1.96, w: 4.8, h: 0.24, fontSize: 11, bold: true, color: C.accent1 });
  card(s, 0.7, 2.3, 4.8, 0.72, C.text2);
  txt(s, [
    { text: "Interface", options: { bold: true, breakLine: true } },
    { text: "Check, Learn, Checklist, Privacy", options: { fontSize: 12 } },
  ], { x: 0.85, y: 2.36, w: 4.5, h: 0.6, color: C.background1, valign: "middle" });
  const boxes = [
    ["Local analysis engine", "Message rules and link parsing"],
    ["Learning content", "Examples and quiz"],
    ["Local storage", "Opt-in only: text size, saved examples"],
  ];
  boxes.forEach((b, i) => {
    const x = 0.7 + i * 1.65;
    s.addShape(pres.shapes.LINE, { x: x + 0.75, y: 3.04, w: 0, h: 0.38, line: { color: C.accent1, width: 1.5, endArrowType: "triangle" } });
    card(s, x, 3.45, 1.5, 1.45, C.background2);
    txt(s, [
      { text: b[0], options: { bold: true, breakLine: true, fontSize: 13, color: C.text2 } },
      { text: b[1], options: { fontSize: 11 } },
    ], { x: x + 0.1, y: 3.52, w: 1.3, h: 1.3 });
  });
  const rows = [
    ["FaLock", "Stays on your device", "No uploads, accounts or analytics"],
    ["FaLink", "Links are never opened", "They are read as text only"],
    ["FaBalanceScale", "Triage, not a verdict", "No percentages. Limits are shown"],
    ["FaUniversalAccess", "Easy to use", "Keyboard, larger text, phone layouts"],
  ];
  for (let i = 0; i < rows.length; i++) {
    const y = 1.25 + i * 0.93;
    await badge(s, 6.05, y + 0.08, 0.55, C.accent1, rows[i][0]);
    txt(s, [
      { text: rows[i][1], options: { bold: true, breakLine: true, color: C.text2 } },
      { text: rows[i][2], options: { fontSize: 12 } },
    ], { x: 6.75, y, w: 2.75, h: 0.8, valign: "middle" });
  }
  s.addNotes("Architecture in one picture. The server only sends files. All analysis happens in the browser, using a transparent rule list rather than an opaque AI score. Nothing is stored unless the person presses a save button, and the incident checklist is never stored. The page also tells the browser not to allow any network connections from its scripts. On the right are the four design commitments: private, never opens links, triage rather than verdict, and usable with keyboard, large text and phones. Accessibility was considered and checked in automated browser tests, but no screen-reader or user testing has been done yet.");

  // ================= Slide 6: Impact =================
  pres.addSection({ title: "Impact and next steps" });
  s = pres.addSlide({ masterName: "CONTENT_LIGHT", sectionTitle: "Impact and next steps" });
  s.addText("Proposed measures of impact", { placeholder: "title" });
  card(s, 0.5, 1.25, 3.0, 2.15, C.text2);
  txt(s, "31 / 31", { x: 0.7, y: 1.35, w: 2.6, h: 0.75, fontSize: 44, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "middle" });
  txt(s, "expected warning signs shown across 9 fictional examples", { x: 0.7, y: 2.12, w: 2.6, h: 0.65, fontSize: 14, color: C.background1 });
  txt(s, "Measured. A consistency check, not accuracy on real scams.", { x: 0.7, y: 2.8, w: 2.6, h: 0.5, fontSize: 11, color: C.background2 });
  card(s, 0.5, 3.55, 3.0, 1.4, C.background2);
  txt(s, [
    { text: "Why this is social impact", options: { bold: true, color: C.text2, breakLine: true } },
    { text: "It builds understanding and safer choices for people with less digital experience.", options: {} },
  ], { x: 0.68, y: 3.65, w: 2.65, h: 1.25, fontSize: 14 });
  const hyp = [
    ["Quiz scores", "Share of questions correct before and after the Learn tab"],
    ["Time to spot signs", "Seconds to find the signs in a fictional message"],
    ["Workshop use", "Examples completed per community session"],
    ["Pilot feedback", "Clarity and usability, with consent"],
  ];
  hyp.forEach((h, i) => {
    const x = 3.7 + (i % 2) * 2.95;
    const y = 1.25 + Math.floor(i / 2) * 1.4;
    card(s, x, y, 2.85, 1.25, C.background2);
    txt(s, "TARGET, NOT YET MEASURED", { x: x + 0.15, y: y + 0.1, w: 2.55, h: 0.2, fontSize: 10, bold: true, color: C.accent2 });
    txt(s, [
      { text: h[0], options: { bold: true, color: C.text2, breakLine: true } },
      { text: h[1], options: { fontSize: 12 } },
    ], { x: x + 0.15, y: y + 0.36, w: 2.55, h: 0.88 });
  });
  const sdg = [["SDG 9", "A light tool with no accounts"], ["SDG 10", "Plain English for everyone"], ["SDG 16", "Safer steps and official reporting"]];
  sdg.forEach((g, i) => {
    const x = 3.7 + i * 1.97;
    card(s, x, 4.05, 1.88, 0.9, C.accent1);
    txt(s, [
      { text: g[0], options: { bold: true, breakLine: true, fontSize: 14 } },
      { text: g[1], options: { fontSize: 11 } },
    ], { x: x + 0.12, y: 4.1, w: 1.66, h: 0.8, color: C.background1, valign: "middle" });
  });
  txt(s, "No external statistics are used in this deck. Any pilot needs consent and honest reporting of sample size.", { x: 0.5, y: 5.03, w: 9, h: 0.2, fontSize: 10, color: C.accent5 });
  s.addNotes("Only one number here is measured: the automated test confirms that for all 9 fictional examples, every expected warning sign appears in the result (31 of 31). That is a consistency check, not a claim about accuracy on real scams. The four cards are proposed measures and are clearly labelled as targets, not results. They come from the project brief: quiz scores before and after, time to spot signs, examples completed in a workshop, and consent-based pilot feedback. Any pilot would need consent, no sensitive data, and honest reporting of sample size and limits. No outside statistics or sources are cited in this deck.");

  // ================= Slide 7: Status + close =================
  s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: "Impact and next steps" });
  s.addText("What is built, and what is next", { placeholder: "title" });
  const cols = [
    ["FaCheckCircle", "Built and tested", [
      "Message and link checker",
      "9 fictional examples, 7-question quiz",
      "Private incident summary",
      "38 automated tests and 21 browser checks passed",
    ]],
    ["FaExclamationTriangle", "Honest limits", [
      "Simple English rules can miss scams",
      "Accuracy and impact not measured yet",
      "Reporting details not set for a location",
    ]],
    ["FaRoute", "Next steps", [
      "Consent-based pilot",
      "Verified local reporting details",
      "Screen-reader testing",
      "Admin page, printable guide, PWA",
    ]],
  ];
  for (let i = 0; i < cols.length; i++) {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.2, 2.9, 3.05, C.background1, { transparency: 90 });
    await badge(s, x + 0.2, 1.35, 0.5, C.background1, cols[i][0], "0B3D5C");
    txt(s, cols[i][1], { x: x + 0.85, y: 1.35, w: 1.95, h: 0.5, fontSize: 16, bold: true, color: C.background1, valign: "middle" });
    txt(s, cols[i][2].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < cols[i][2].length - 1 } })),
      { x: x + 0.2, y: 2.0, w: 2.55, h: 2.15, color: C.background1, paraSpaceAfter: 5 });
  }
  card(s, 0.5, 4.4, 9.0, 0.7, C.accent1);
  txt(s, "Try it: paste a fictional message and see exactly why it raises caution.", { x: 0.75, y: 4.4, w: 8.5, h: 0.7, fontSize: 18, bold: true, color: C.background1, valign: "middle" });
  s.addNotes("Close with honesty. Built and tested: the checker, the examples and quiz, the incident summary, and the privacy page, backed by 38 automated tests and 21 browser checks that all passed. Limits: simple English rules, no measured accuracy or impact, and reporting details that still need to be set for a real location. Next: a consent-based pilot with a community group, verified local reporting details, screen-reader testing, and the optional items from the brief (admin page, printable guide, installable app). Then invite the judges to try it with a fictional message.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("Wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
