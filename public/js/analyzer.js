// ScamShield local analysis engine.
// Transparent, rule-based triage. Runs entirely in the browser (or Node for tests).
// It never fetches a URL, never calls a network service, and never stores input.
// Output is triage guidance, NOT a probability of fraud.

export const LABELS = {
  high: "High caution",
  review: "Review carefully",
  none: "No obvious warning signs detected",
};

const SEVERITY_POINTS = { high: 3, medium: 2, low: 1 };

// ---------- Message rules ----------
// Each rule: id, name, severity, patterns (RegExp[]), why, action.
export const MESSAGE_RULES = [
  {
    id: "credential-request",
    name: "Asks for a secret code or password",
    severity: "high",
    patterns: [
      /\b(share|send|give|tell|provide|enter|reply with|confirm|verify)\b[^.\n]{0,40}\b(otp|one[- ]time (password|code|pin)|pin|password|passcode|cvv|recovery code|security code|verification code|passphrase)\b/i,
      /\b(otp|pin|cvv|password|recovery code)\b[^.\n]{0,25}\b(to (us|me|the agent|our team|verify|confirm|unblock|continue))\b/i,
    ],
    why: "Real banks and services never ask you to share one-time codes, PINs or passwords. Anyone who has them can take over your account or approve payments.",
    action: "Do not share the code. Stop replying and contact the company using a phone number or app you found on your own.",
  },
  {
    id: "remote-access",
    name: "Asks you to install a remote-access or screen-sharing app",
    severity: "high",
    patterns: [
      /\b(anydesk|teamviewer|quicksupport|ultraviewer|airdroid|rustdesk|supremo)\b/i,
      /\b(install|download|open)\b[^.\n]{0,40}\b(remote (access|support|control)|screen[- ]?shar(e|ing))\b/i,
      /\bremote (access|control) (app|software|tool)\b/i,
    ],
    why: "A remote-access app lets another person see and control your phone or computer, including your banking apps.",
    action: "Do not install the app or allow screen sharing. If one is already installed, remove it and contact your bank through an official channel.",
  },
  {
    id: "threat",
    name: "Threatens to block, suspend or take action",
    severity: "medium",
    patterns: [
      /\b(account|card|sim|number|wallet|service|connection|package|parcel)\b[^.\n]{0,40}\b(will be|has been|is being|shall be|gets?)\b[^.\n]{0,15}\b(blocked|suspended|deactivated|frozen|closed|terminated|disconnected|cancelled|canceled|returned|seized)\b/i,
      /\b(legal action|arrest warrant|police case|court notice|fir will|penalty will|fine will)\b/i,
      /\b(blocked|suspended|deactivated|frozen)\b[^.\n]{0,25}\b(unless|if you (do not|don't|fail))\b/i,
    ],
    why: "Scammers use fear of losing access or facing penalties to stop you from thinking carefully.",
    action: "Pause. Check the status yourself by opening the official app or typing the official website address, not by using this message.",
  },
  {
    id: "urgency",
    name: "Pressure to act immediately",
    severity: "medium",
    patterns: [
      /\b(urgent(ly)?|immediately|right now|act now|asap|final (notice|warning|reminder)|last chance|today only|expires? (today|soon|in \d+)|within \d+ ?(hours?|hrs?|minutes?|mins?)|before midnight|without delay)\b/i,
    ],
    why: "Real organisations usually allow time to respond. Artificial deadlines are a common way to rush people into mistakes.",
    action: "Take a few minutes. Talk to someone you trust and verify the request independently before doing anything.",
  },
  {
    id: "payment-demand",
    name: "Asks for a fee, deposit or transfer",
    severity: "medium",
    patterns: [
      /\b(pay|send|transfer|deposit|remit)\b[^.\n]{0,40}\b(fee|fees|charge|charges|deposit|amount|money|rs\.?|inr|usd|\$|₹|€|£|payment)\b/i,
      /\b(registration|processing|clearance|customs|delivery|redelivery|handling|release|activation|refundable|security) (fee|fees|charge|charges|deposit)\b/i,
      /\b(gift ?cards?|upi (id|request)|wire transfer|bank transfer)\b/i,
    ],
    why: "Requests for upfront money are the core of many scams: fake jobs, parcels, prizes and investments often start with a small fee.",
    action: "Do not pay. Contact the sender's organisation through an official website or app to ask whether the fee is real.",
  },
  {
    id: "unrealistic-reward",
    name: "Promises a prize, reward or guaranteed returns",
    severity: "medium",
    patterns: [
      /\b(you (have )?(won|been selected|are selected|are the lucky|qualify)|congratulations|lucky (winner|draw)|lottery|jackpot|free gift|claim your (prize|reward|gift))\b/i,
      /\b(guaranteed|assured|risk[- ]free|no risk)\b[^.\n]{0,30}\b(returns?|profits?|income|earnings?)\b/i,
      /\b(double|triple) your (money|investment)\b/i,
      /\b\d{2,3} ?% (returns?|profit|weekly|daily|monthly)\b/i,
      /\b(earn|make)\b[^.\n]{0,20}\b(\d[\d,]*)\b[^.\n]{0,20}\b(per day|daily|a day|per week|weekly)\b[^.\n]{0,25}\b(from home|without|easy|simple)\b/i,
    ],
    why: "If an offer sounds too good to be true, it often is. Real prizes do not require a fee, and real investments cannot guarantee high returns.",
    action: "Do not respond or pay. Search for the offer on the organisation's official website and ask a trusted person for a second opinion.",
  },
  {
    id: "unusual-channel",
    name: "Moves the conversation or payment to an unusual channel",
    severity: "medium",
    patterns: [
      /\b(contact|message|chat|text|reach|add) (me|us|him|her|our (agent|manager|officer|team))\b[^.\n]{0,25}\b(on|via|through)\b[^.\n]{0,12}\b(whatsapp|telegram|signal|messenger|private chat)\b/i,
      /\b(whatsapp|telegram)\b[^.\n]{0,30}\b(number|group|channel|link|chat)\b/i,
      /\b(pay|payment|deposit|invest)\b[^.\n]{0,25}\b(in|using|via|with)\b[^.\n]{0,10}\b(crypto(currency)?|bitcoin|usdt|gift ?cards?)\b/i,
    ],
    why: "Moving to private chat apps or unusual payment types makes it harder for you to get help and harder to reverse payments.",
    action: "Keep the conversation on the official channel of the organisation, and be cautious of any request to switch.",
  },
  {
    id: "family-emergency",
    name: "Claims a relative or friend is in urgent trouble",
    severity: "medium",
    patterns: [
      /\b(this is my new (number|phone)|changed my number|lost my phone)\b/i,
      /\b(mom|mum|mother|dad|father|son|daughter|brother|sister|grandma|grandpa|uncle|aunt)\b[^.\n]{0,60}\b(accident|hospital|arrested|jail|trouble|emergency|stuck|stranded)\b/i,
      /\b(don'?t|do not) (tell|call|inform) (anyone|mom|dad|mum|family|your family)\b/i,
    ],
    why: "Scammers pretend to be a loved one using a new number and an emergency, hoping you will send money before checking.",
    action: "Call the person on the number you already have, or ask another family member, before sending anything.",
  },
  {
    id: "impersonation",
    name: "Uses the name of a trusted organisation",
    severity: "low",
    patterns: [
      /\b(dear (customer|user|account holder|valued customer|sir\/madam)|your (bank|kyc|account|wallet|card|parcel|courier|package|order))\b/i,
      /\b(kyc|know your customer)\b[^.\n]{0,30}\b(update|expire|expired|pending|incomplete|verification)\b/i,
      /\b(customer (care|support|service)|helpdesk|help desk|support team|security team|fraud (department|team)|tax department|income tax|customs (officer|department)|courier (company|service)|delivery (partner|team)|post office|telecom|bank (officer|manager|representative))\b/i,
    ],
    why: "Scam messages often borrow the name of a bank, courier or government office. A familiar name is not proof that the message is real, and a generic greeting is a small warning sign.",
    action: "Do not trust the name alone. Contact the organisation using details from its official website or the back of your card.",
  },
  {
    id: "link-in-message",
    name: "Contains a link to open",
    severity: "low",
    patterns: [
      /\b(https?:\/\/|www\.)\S+/i,
      /\b(click|tap|open|visit|follow)\b[^.\n]{0,20}\b(link|here|below)\b/i,
    ],
    why: "Links in unexpected messages can lead to look-alike websites that collect your details. A link alone does not mean a message is fake, but it deserves care.",
    action: "Do not tap the link. Type the organisation's official web address yourself or use its official app. You can paste the link into the URL checker to inspect its structure.",
  },
];

// ---------- Helpers ----------

/** Mask long digit runs so that codes or card numbers are never echoed back. */
export function maskSensitive(text) {
  return String(text).replace(/\d{4,}/g, (m) => "•".repeat(m.length));
}

/** Build a short, safe excerpt around a match. */
export function excerpt(text, index, length, radius = 28) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  let s = text.slice(start, end).replace(/\s+/g, " ").trim();
  s = maskSensitive(s);
  return (start > 0 ? "… " : "") + s + (end < text.length ? " …" : "");
}

function sortIndicators(list) {
  const order = { high: 0, medium: 1, low: 2 };
  return list.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------- Message analysis ----------

export function analyzeMessage(text) {
  const input = typeof text === "string" ? text : "";
  const indicators = [];
  if (!input.trim()) return indicators;

  for (const rule of MESSAGE_RULES) {
    for (const pattern of rule.patterns) {
      const m = pattern.exec(input);
      if (m) {
        indicators.push({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          evidence: excerpt(input, m.index, m[0].length),
          why: rule.why,
          action: rule.action,
          source: "message",
        });
        break; // one match per rule keeps the output readable
      }
    }
  }
  return sortIndicators(indicators);
}

// ---------- URL analysis ----------

export const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly",
  "cutt.ly", "shorturl.at", "tiny.cc", "rb.gy", "s.id", "lnkd.in", "wa.me",
];

// Used only to approximate the "registrable" part of a domain.
const TWO_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "co.in", "net.in", "org.in", "gov.in", "nic.in", "ac.in",
  "com.au", "net.au", "org.au", "co.nz", "co.za", "com.br", "com.sg", "com.my", "co.jp",
]);

// A short list of generic words people associate with trusted services.
const TRUST_WORDS = [
  "bank", "secure", "verify", "login", "signin", "account", "update", "kyc", "support",
  "wallet", "payment", "refund", "customer", "official", "helpdesk", "delivery", "parcel", "courier",
];

export function registrableDomain(hostname) {
  const labels = hostname.toLowerCase().split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  if (TWO_PART_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

export function parseUrlSafely(raw) {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, error: "empty" };
  if (/[\s<>"]/.test(value)) return { ok: false, error: "spaces-or-markup" };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  const candidate = hasScheme ? value : "https://" + value; // only for parsing, never opened
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, error: "unparseable" };
  }
  if (!["http:", "https:"].includes(url.protocol)) return { ok: false, error: "unsupported-scheme" };
  if (!url.hostname || (!url.hostname.includes(".") && !/^\[.*\]$/.test(url.hostname)))
    return { ok: false, error: "no-domain" };
  return { ok: true, url, hadScheme: hasScheme };
}

export function analyzeUrl(raw) {
  const parsed = parseUrlSafely(raw);
  if (!parsed.ok) return { parsed, indicators: [] };

  const { url, hadScheme } = parsed;
  const host = url.hostname.toLowerCase();
  const indicators = [];
  const add = (id, name, severity, evidence, why, action) =>
    indicators.push({ id, name, severity, evidence, why, action, source: "url" });

  // Shortener
  if (SHORTENERS.includes(host)) {
    add(
      "url-shortener", "Link shortener hides the real destination", "medium", host,
      "Short links hide where you will end up. Scammers use them to disguise unfamiliar websites.",
      "Do not open it. Ask the sender for the full address through a trusted channel, or avoid the link."
    );
  }

  // IP address host
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[.*\]$/.test(host)) {
    add(
      "url-ip-address", "Web address uses numbers instead of a name", "medium", host,
      "Real organisations almost always use a normal domain name. A raw number is unusual for a bank or delivery service.",
      "Do not enter any details. Find the organisation's real website on your own."
    );
  }

  // Userinfo trick
  if (url.username || url.password || /@/.test(url.href.split("/")[2] || "")) {
    add(
      "url-at-symbol", "Contains an '@' symbol before the domain", "high", host,
      "Text before an '@' can make a link look like a trusted site while it actually goes somewhere else.",
      "Do not open it. The real destination is the part after the '@'."
    );
  }

  // Punycode / look-alike characters
  if (host.split(".").some((l) => l.startsWith("xn--"))) {
    add(
      "url-punycode", "Domain uses encoded look-alike characters", "medium", host,
      "Some web addresses use special characters that look like normal letters. This can imitate a trusted name.",
      "Type the organisation's address yourself instead of using this link."
    );
  }

  // Not HTTPS
  if (hadScheme && url.protocol === "http:") {
    add(
      "url-no-https", "Link does not use a secure connection (http)", "low", "http://" + host,
      "Websites that ask for personal or payment details should use a secure connection. Missing security is a warning sign, but secure sites can also be fake.",
      "Do not enter personal or payment details on this site."
    );
  }

  // Many subdomains
  const labels = host.split(".");
  const reg = registrableDomain(host);
  const regLabels = reg.split(".").length;
  if (labels.length - regLabels >= 3) {
    add(
      "url-many-subdomains", "Unusually long chain of sub-parts in the address", "low", host,
      "Long chains can bury the real domain name. Only the end part, just before the final suffix, shows who runs the site.",
      "Look at the last two or three parts of the address to see who really owns it."
    );
  }

  // Trust words in places other than the registrable domain, or hyphen-heavy domain
  const left = host.slice(0, host.length - reg.length);
  const trustInSub = TRUST_WORDS.filter((w) => left.includes(w));
  const hyphenCount = (reg.match(/-/g) || []).length;
  if (trustInSub.length) {
    add(
      "url-trust-words-subdomain", "Trust words appear in the sub-part of the address", "medium",
      `${left.replace(/\.$/, "")} is only a sub-part of "${reg}"`,
      "Words like 'bank' or 'secure' placed before the real domain can make a site look official. The owner is the main domain, here shown as: " + reg + ".",
      "Check whether the main domain really belongs to the organisation you expect, using its official website or app."
    );
  } else if (hyphenCount >= 1 && TRUST_WORDS.some((w) => reg.includes(w))) {
    add(
      "url-hyphen-trust-domain", "Domain mixes hyphens with trust words", "low", reg,
      "Hyphenated names that include words like 'secure' or 'bank' are a common pattern in imitation websites, though some real sites use hyphens too.",
      "Compare the domain with the official one printed on your card, statement or official app."
    );
  }

  // Credential words in path/query
  const pathAndQuery = decodeURIComponent((url.pathname + url.search).toLowerCase().replace(/%(?![0-9a-f]{2})/gi, ""));
  const credWords = ["otp", "password", "passcode", "pin", "cvv", "kyc", "verify", "login", "signin", "unblock", "refund"].filter(
    (w) => new RegExp("(^|[^a-z])" + w + "([^a-z]|$)").test(pathAndQuery)
  );
  if (credWords.length) {
    add(
      "url-sensitive-path", "Address mentions login, verification or secret-code words", "low",
      credWords.join(", "),
      "Pages that ask for logins, codes or verification are common targets for imitation. This does not prove the page is fake.",
      "Never enter secret codes through a link you received. Go to the official site or app yourself."
    );
  }

  // Very long URL
  if (url.href.length > 120) {
    add(
      "url-very-long", "Very long web address", "low", `${url.href.length} characters`,
      "Very long addresses can hide the important part. It is a weak signal on its own.",
      "Focus on the main domain and be careful before entering any details."
    );
  }

  // Unusual port
  if (url.port && !["80", "443"].includes(url.port)) {
    add(
      "url-unusual-port", "Uses an unusual network port", "low", `port ${url.port}`,
      "Ordinary public websites rarely need a visible port number.",
      "Be cautious and avoid entering details."
    );
  }

  return { parsed, indicators: sortIndicators(indicators), domain: reg, host };
}

// ---------- Overall triage ----------

export const GENERAL_STEPS = [
  "Do not share OTPs, PINs, passwords, recovery codes or remote-access permissions with anyone.",
  "Do not transfer money just because a message creates urgency.",
  "Verify the request using a phone number, website or app you obtained independently from an official source.",
  "Do not use contact details or links supplied by the suspicious message to verify it.",
];

export const LOSS_STEPS = [
  "If money has already been lost or codes were shared, contact your bank or payment provider immediately using an official number.",
  "Report it through the official cybercrime reporting channel for your location.",
  "Preserve screenshots, times, transaction references and sender details. Avoid sharing more sensitive information than needed.",
];

export function triage({ message = "", url = "" } = {}) {
  const hasMessage = typeof message === "string" && message.trim().length > 0;
  const hasUrl = typeof url === "string" && url.trim().length > 0;

  if (!hasMessage && !hasUrl) {
    return { status: "empty", error: "Paste a message, enter a link, or both." };
  }
  if (hasMessage && message.length > 5000) {
    return { status: "error", error: "That message is very long. Please paste up to 5,000 characters." };
  }

  const msgIndicators = hasMessage ? analyzeMessage(message) : [];
  let urlResult = null;
  let urlProblem = null;
  if (hasUrl) {
    urlResult = analyzeUrl(url);
    if (!urlResult.parsed.ok) {
      urlProblem = {
        empty: "Please enter a link.",
        "spaces-or-markup": "That does not look like a single web address. Remove spaces or extra text.",
        unparseable: "That link could not be read. Check it for typing mistakes.",
        "unsupported-scheme": "Only web addresses that begin with http or https can be inspected.",
        "no-domain": "That does not look like a full web address. It needs a domain such as example.com.",
      }[urlResult.parsed.error];
      if (!hasMessage) return { status: "error", error: urlProblem };
    }
  }
  const urlIndicators = urlResult && urlResult.parsed.ok ? urlResult.indicators : [];

  // If the message contains links and no separate URL was supplied, inspect the first one locally.
  let embeddedUrlNote = null;
  let embeddedIndicators = [];
  if (hasMessage && !hasUrl) {
    const m = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/i.exec(message);
    if (m) {
      const r = analyzeUrl(m[0].replace(/[.,;:!?]+$/, ""));
      if (r.parsed.ok) {
        embeddedUrlNote = "A link inside the message was inspected locally. It was not opened.";
        embeddedIndicators = r.indicators;
      }
    }
  }

  const indicators = sortIndicators([...msgIndicators, ...embeddedIndicators, ...urlIndicators]);

  // Transparent scoring. The number is internal; it is never shown as a percentage.
  const score = indicators.reduce((sum, i) => sum + SEVERITY_POINTS[i.severity], 0);
  const hasHigh = indicators.some((i) => i.severity === "high");
  const mediumCount = indicators.filter((i) => i.severity === "medium").length;

  let level;
  if (hasHigh || score >= 6 || mediumCount >= 3) level = "high";
  else if (score >= 2) level = "review";
  else level = "none";

  // Single weak signals stay at "review" at most, never "high".
  const steps = [...GENERAL_STEPS];
  const seen = new Set(steps);
  for (const i of indicators) {
    if (!seen.has(i.action)) {
      steps.push(i.action);
      seen.add(i.action);
    }
  }

  return {
    status: "ok",
    level,
    label: LABELS[level],
    score, // kept for transparency and tests; not shown as a probability
    indicators,
    steps,
    lossSteps: LOSS_STEPS,
    urlProblem,
    embeddedUrlNote,
    inspected: { message: hasMessage, url: hasUrl && !urlProblem },
    disclaimer:
      "This is triage guidance, not a verdict. A result of no obvious warning signs does not prove a message is legitimate, and a message can be dangerous without matching any rule here. When in doubt, verify through an official channel you find yourself.",
  };
}
