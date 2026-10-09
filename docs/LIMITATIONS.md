# Limitations and Next Steps

## Limitations (as built)

- **Simple rules.** The checker uses a fixed list of patterns. It can miss real scams and can flag genuine messages.
- **English only.** The interface, rules and examples are English only, by design for this version.
- **No measured accuracy.** The only measurement made is that the checker shows the expected signs for the 9 fictional
  examples and a few hand-written messages (an internal consistency check, not accuracy on real scams).
- **No measured impact.** No pilot with real people has been run. Impact figures are not claimed.
- **URL checks are structural only.** The link is parsed as text. There is no reputation lookup and no page inspection,
  so an unfamiliar domain is not labelled bad and a normal-looking domain is not labelled safe.
- **Approximate domain parsing.** The registrable domain is found with a short list of common two-part suffixes, not the
  full public suffix list.
- **Reporting details are not configured.** `public/js/config.js` ships with a generic placeholder. A deployer must add
  verified details for their location.
- **No integrations.** ScamShield does not contact banks, police or any reporting service.
- **Local storage only.** Saved examples live in one browser on one device and are lost if site data is cleared.
- **Not a full accessibility audit.** Keyboard use, labels, contrast and text resizing were considered and checked in
  automated browser tests, but no screen-reader testing or user testing has been done.
- **Not tested as an installed app.** There is no offline mode or PWA support.

## Not built (optional items from the brief)

Community dashboard, printable one-page guide, administrator page, decision tree, PWA installation.

## Suggested next steps

1. Run a small, consent-based pilot with a workshop group. Record quiz results before and after, time to spot signs,
   and comprehension feedback. Report the sample size and limits honestly.
2. Add verified reporting details for the first deployment location.
3. Run screen-reader and low-vision testing, and improve from the findings.
4. Widen the rules with community-contributed fictional examples, keeping a test for each rule.
5. Add a printable workshop guide and a simple administrator page for fictional examples.
6. Consider PWA installation for easier phone access.
