# ScamShield Architecture

ScamShield is a small static web app. All analysis happens in the browser.

```
 Person  --->  Browser (public/)
                |-- app.js        User interface and navigation (plain JavaScript)
                |-- analyzer.js   Local rule engine: message rules + URL parser
                |-- data.js       Fictional examples, quiz, checklist options
                |-- config.js     Official reporting details (editable)
                |-- localStorage  Text-size choice and examples the person chooses to save
 
 Node static server (server.js)  --->  serves files only, adds Content-Security-Policy
```

## Components

**Interface (`app.js`, `index.html`, `styles.css`)**
Four views (Check, Learn, Checklist, Privacy) switched by the URL hash. All user text is written to the page
with `textContent`, never as HTML. Focus moves to the page heading after navigation. Labels, live regions,
a skip link and a larger-text option support keyboard and screen-reader use.

**Local analysis engine (`analyzer.js`)**
- Message rules: ten named indicators, each with patterns, a severity (strong, moderate, minor), a plain-English
  reason and a suggested action. Matched evidence is shown as a short excerpt with long digit runs masked.
- URL analysis: the address is parsed with the built-in `URL` class. It is never opened, fetched or executed.
  Checks cover shorteners, raw IP addresses, an `@` before the domain, encoded look-alike characters, missing
  HTTPS, long chains of sub-parts, trust words placed in the sub-part of a domain, login or code words in the path,
  very long addresses and unusual ports. An unfamiliar domain is not treated as malicious on its own.
- Triage: points per severity (3, 2, 1) are added up. A strong sign, a score of 6 or more, or three moderate signs
  gives High caution. A score of 2 or more gives Review carefully. Otherwise No obvious warning signs detected.
  The score is internal and never shown as a percentage.
- Safe next steps combine four general steps with the action for each indicator found.

**Content (`data.js`)**
Nine fictional examples, seven quiz questions, checklist options and a glossary. A test checks that the engine
shows every expected sign for every example.

**Server (`server.js`)**
Serves the `public` folder with GET and HEAD only. It rejects other methods, blocks path traversal, does not log
requests, and sends a Content-Security-Policy that allows only same-origin files and no network connections
from scripts (`connect-src 'none'`).

## Data flow for a check

1. The person types text and/or a link and presses Check.
2. `triage()` runs in the browser and returns the label, indicators, steps and disclaimer.
3. The interface renders the result. Nothing is stored or sent.
4. Only if the person presses Save, a copy with long digit runs masked is stored in localStorage.

## Deliberate design choices

- No framework, no build step, no runtime dependencies: easy to run, easy to audit.
- No database and no accounts: there is nothing to leak.
- No AI model: a transparent rule list is easier to explain and test. If a model is added later it must be
  optional, disclosed, and the app must keep working without it.
