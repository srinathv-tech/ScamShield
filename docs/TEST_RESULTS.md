# Recorded Test Results

Recorded on 9 October 2026 with Node v22.22.0 (Chromium 141 for the browser checks).

## Automated tests: `npm test`

Result: **38 tests, 38 passed, 0 failed.**

| File | Covers |
| --- | --- |
| `test/analyzer.test.js` | Indicators, evidence, labels, disclaimers, no percentages, digit masking, empty and long input, URL rules, invalid URLs, no network use, safe next steps |
| `test/content.test.js` | At least 8 examples across the required scam types, expected signs shown for every example, quiz structure, no personal data in samples, English-only source text, no language switcher |
| `test/privacy.test.js` | No network, popup, redirect, eval or HTML-injection calls in browser code, no external assets, submitted links never clickable, only two storage keys, no password fields |
| `test/server.test.js` | Page served, Content-Security-Policy with `connect-src 'none'`, JavaScript content type, path traversal refused, POST refused |

## Browser end-to-end checks: `node scripts/e2e.mjs`

Result: **21 checks passed, 0 failed.** (16 desktop at 1280x800, 5 phone-size at 390x844.)

Covered: empty-input message, sample check with High caution, URL-only check, bad link message, ordinary message
result, nothing stored unless saved, explicit save then reload then delete, example reveal, full 7-question quiz,
checklist summary with hidden secrets, copy and download, clear form, text-size persistence and delete-all, keyboard
skip link, zero requests leaving localhost, and no sideways scrolling on phone width for all four screens.

## Issues found and fixed during testing

- Quiz answer buttons were not rendering (an array was passed where elements were expected). Fixed.
- A stray word "null" appeared in the example explanation and could appear in the checklist warning. Fixed, and a
  browser check now guards against it.
- The first Tab press skipped the "Skip to main content" link because focus moved to the heading on first load. Fixed.
- A hyphenated but ordinary domain was flagged. The rule now needs a trust word as well. A test covers it.

## Not tested

Screen readers, Safari and Firefox, real phones, and real-world scam messages.
