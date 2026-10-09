# ScamShield - Digital Fraud Awareness and Scam Triage

ScamShield helps people recognise suspicious messages and links, learn how common scams work,
and prepare safer next steps without exposing private information.

It is an **educational assistant, not a fraud detector**. It never says a message is definitely safe
or definitely a scam. It shows observable warning signs, explains them in plain English, and
encourages checking through an official channel that you find yourself.

Built for the Hack for Social Cause (VBYLD 2027) theme: Digital Safety and Cyber Fraud Awareness.
Related UN SDGs: 9, 10 and 16.

## What it does

| Area | What you can do |
| --- | --- |
| Check | Paste message text and/or a link. Get a triage label, the exact warning signs found, why each matters, and safe next steps. |
| Learn | Open 9 fictional examples, pick the warning signs you can spot, reveal the explanation, then take a 7-question quiz with instant feedback. |
| Checklist | Prepare a private incident summary (what happened, when, where, money, what was shared) and copy it or download it as a text file. |
| Privacy | See what is stored on your device and delete it in one click. Read the limits of the tool. |

Triage labels: **High caution**, **Review carefully**, **No obvious warning signs detected**.
These are guidance, not probabilities. No percentages are shown.

## Prerequisites

- Node.js 18 or newer (tested with Node 22). Check with `node -v`.
- A modern browser (Chrome, Edge, Firefox or Safari).
- No other installation is needed. There are no npm dependencies.

## Run it

```bash
cd scamshield
npm start
```

Open http://localhost:5173 in your browser. To use another port: `PORT=8080 npm start`.
To try it on a phone, use your browser's device toolbar (phone-sized viewport) or open the page
from a phone on the same network after allowing it in your firewall. The server listens on
127.0.0.1 only by default, so edit `server.js` if you deliberately want other devices to connect.

## Test it

```bash
npm test
```

Runs 38 automated tests with Node's built-in test runner (analysis rules, URL parsing, example data,
privacy rules in the source code, and the static server). See `docs/TEST_RESULTS.md` for the recorded results.

Browser end-to-end checks (optional) use Playwright, which is not a project dependency:

```bash
npm install --no-save playwright
npx playwright install chromium
node scripts/e2e.mjs            # 21 checks, desktop and phone-size viewports
node scripts/screenshots.mjs    # regenerates docs/screenshots/*.png
```

The presentation (`docs/ScamShield_Presentation.pptx`, 7 slides) is built from those screenshots by
`scripts/build-deck.cjs`, which needs pptxgenjs, sharp, react, react-dom and react-icons (not project dependencies).

If Playwright is already installed elsewhere, set `PLAYWRIGHT_MODULE` to the path of its `index.mjs` file.

## Try the demo

1. Open **Check**, press **Try a fictional sample**, then **Check on this device**.
2. Read the label, the matched warning signs and the safe next steps.
3. Open **Learn**, pick an example, tick the signs you notice, press **Reveal explanation**, then start the quiz.
4. Open **Checklist**, fill in a few fields and press **Copy summary**.

The full 3-minute script is in `docs/DEMO_SCRIPT.md`.

## Project layout

```
public/            The whole app (served as static files)
  index.html       Page shell and navigation
  styles.css       Responsive, accessible styling
  js/analyzer.js   Local rule-based message and URL analysis (also used by tests)
  js/data.js       Fictional examples, quiz, checklist options, glossary
  js/config.js     Official reporting details (edit for your location)
  js/app.js        User interface
server.js          Small static server with a strict Content-Security-Policy
test/              Automated tests (node --test)
scripts/           Browser end-to-end checks and screenshot capture
docs/              Architecture, demo script, limitations, test results, screenshots, presentation
```

## Privacy in one minute

- Checks run in the browser. Messages and links are not sent anywhere.
- Links are parsed as text. They are never opened or fetched.
- Nothing is stored unless you press a save button. The only stored items are your text-size choice and examples you choose to keep (browser localStorage).
- The incident checklist is never stored. Reloading clears it.
- The server serves files only. It has no endpoint that accepts data and does not log request details.
- The page's Content-Security-Policy blocks all network connections from page scripts (`connect-src 'none'`).

## Configure official reporting details

Reporting channels differ by country. Open `public/js/config.js` and set the jurisdiction, the steps,
and optionally an official portal and helpline. Verify every entry with the official source first.
The shipped default is deliberately generic and says that no location is configured. ScamShield does not
file complaints.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `npm start` says the port is in use | Use another port: `PORT=8080 npm start` |
| The page is blank | Open it through the server (http://localhost:5173), not by double-clicking `index.html`. The app uses JavaScript modules, which browsers block on `file://` pages. |
| `node: command not found` | Install Node.js 18 or newer from the official Node.js website. |
| Copy button does nothing | Some browsers restrict clipboard access. The summary is then selected so you can press Ctrl+C. |
| Saved examples disappeared | They live in this browser only. Clearing site data or using a private window removes them. |
| E2E script cannot find Playwright | Install it as shown above or set `PLAYWRIGHT_MODULE`. |

## Limitations

See `docs/LIMITATIONS.md`. In short: the rules are simple and English-only, they will miss some scams and
flag some real messages, and no accuracy or real-world impact has been measured.

## Licence

MIT. All example messages are fictional.
