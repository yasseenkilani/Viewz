# Viewz website audit (24 Nov 2026)

Scope: the real source in `~/viewz-site` (built from `pages/*.html` by `build.py`), published at https://claude.ai/artifact/FagtqKuzTJ7tZqC4VVnFWH. Six pages, all links, all images, the order form, the mobile menu, the hero route animation. Checked by script (links, anchors, image files, alt text, headings) and by screenshots at 1440px and 390px.
Not covered: real phones, Safari, screen-reader testing, and anything that needs the finished sample film.

## Fixed in this round
| # | Finding | Fix |
|---|---|---|
| F1 | Samples page showed 4 "flown" homes, but no film exists; all four cards used the same floor plan | One featured sample with an honest "film arriving" tag; the other three are a plain "Next in production" list |
| F2 | Homepage "drone-style" wording implied a shoot; the service was not stated on the first screen | New first-screen copy plus "You send / We build / No shoot" line; Watch a walkthrough is the first button |
| F3 | Form did not say if it was a quote or an order, or what happens next | "Request a quote" button, 3-step explainer, FAQ on cost |
| F4 | Accuracy promise was inconsistent ("every room" vs "nothing invented" vs "as far as photos prove") | One promise everywhere: verified against the plan and photos, unverified rooms left out |
| F5 | No navigation on phones (menu hidden below 1000px) | Menu button with all pages and FAQs; header button stays |
| F6 | "show up." outline was faint on phones | Brighter, thicker stroke |
| F7 | Logo images 400 KB and 180 KB for a 54px logo, loaded on every page | Resized to 440px wide: 87 KB and 77 KB |
| F8 | The featured card described a route through the kitchen and bedroom for a film that does not exist | Reworded to a general description |

## Open, in priority order
1. **Order form does not deliver.** It opens the visitor's email app addressed to dev@viewz.me (`ENDPOINT` in `main.js` is empty). It fails on phones with no mail app and the boss never sees a request that was started but not sent. Needs a webhook (n8n) and a test enquiry that reaches the right inbox. Blocker for launch.
2. **No playable sample.** Drop `media/pilot-1.mp4` and `media/pilot-1.jpg` in; the card and the homepage button switch to a player by themselves. The pop-up player has never been tested with a real video.
3. **No original-photo beside video-frame comparison.** Needs the real sample.
4. **No direct contact option.** Dubai brokers buy on WhatsApp. Add a WhatsApp link once the business number is decided (do not use a personal number).
5. **Prices and response time are unpublished or unconfirmed.** "Within one working day" is a promise the boss must confirm he can keep. Price proposals are in the founder research (AED 329 trial, AED 549 film) and need approval before publishing.
6. **Favicon is a hand-redrawn V**, not the real brand mark. Needs a crop from the original logo file.
7. **Social previews:** `og:image` is a relative path, so link previews on WhatsApp and LinkedIn will not show it until the site has its real domain (viewz.me). Also uses a stock photo.
8. **Hero animation has no pause control** (accessibility guideline for motion that runs over 5 seconds). It does respect reduced-motion settings.
9. **Stock photos stand in for real frames** on the home and Samples pages. They are labelled "Example interior frame". Replace with frames from the real sample.
10. **No analytics**, so there is no way to see which pages prospects open.
11. **Hosting:** it is a Claude-hosted preview link. Needs a real host and domain before it goes in pitches.

## Checked and fine
All internal links and anchors resolve; every image has alt text; one H1 per page; images and files all present; focus outline visible; reduced-motion handled; FAQ opens and closes; form validation messages show.

## Front ends added (24 Nov)
- Quote form: WhatsApp number now required (UAE numbers normalised to +971), consent tick-box, hidden bot trap, 6-digit WhatsApp code step. Talks to `CONFIG.API` in main.js (`POST /quote`, `POST /verify`). Empty = falls back to email.
- WhatsApp buttons (form page and footer): switch on when `CONFIG.WHATSAPP` is set.
- `pay.html` secure payment page: reads `?q=<quote id>`, loads the quote (`GET /quote/:id`), `POST /checkout` returns a Stripe URL; the page only follows it if the host is checkout.stripe.com. Preview at `pay.html#preview`. Marked noindex.
- `_headers` file with security headers and a CSP for Cloudflare Pages. Add the API address to `connect-src` once it exists.
- Backend still to build: /quote, /verify, /quote/:id, /checkout, Stripe webhook (signature checked), WhatsApp send.

## Full functional audit (24 Nov, evening)
Automated run in headless Chrome: 7 pages x 4 widths (1440, 1024, 768, 390), all links and anchors, every feature, form and payment flows against a mock back-end, CSP from `_headers` applied. Result after fixes: 196/196 checks pass.
Fixed in this round:
- Quote form could send 3 requests on a fast triple-click. Button now locks while sending (code step too).
- Expired or unknown payment link showed nothing. Now says the link is not valid and to message us.
- Samples page logged a 404 every load while checking for the film. Films are now listed in `media/films.json` (add "media/pilot-1.mp4" when the film arrives).
- Heading order skipped a level on How it works and Samples (screen readers). Fixed.
- Footer links and consent box were under 24px tap size on phones. Fixed.
- "Next in production" rows wrapped unevenly on phones. Fixed.
Not covered: real iPhone/Safari, a screen reader by ear, real WhatsApp/Stripe (no accounts yet).

## Independent audit, round 2 (24 Nov)
A second agent audited the live site and source (12 findings, none P0). Fixed: Enter in the code box re-submitted the quote; phone normalisation (+971 (0)50, short UAE numbers, bare 971…); pay page now only enables payment for open quotes with a price; honeypot renamed hp_x7; "(optional)" label misalignment; modal now has aria-modal, a focus trap and cleans up its Escape listener; listing link must match as a whole; footer/form WhatsApp tap size; descriptive alt text; decorative numerals hidden from screen readers; home Samples card no longer promises a finished film; "Next in production" renamed "Planned samples". Regression run: 196/196.
Needs the boss: privacy policy and terms page plus retention period and a role email instead of dev@viewz.me; whether The Pad, Collective Tower 1, Seraya 25 and Address Residences Dubai Opera are real jobs and may be named; og:image absolute URL, canonical and og:url need the final domain.

## Merged home (25 Nov 2026)
Home rebuilt on the reference studio site's structure: photo cover, screening room (film + clickable floor plan with live camera marker, share-a-moment), "Behind the film" (source model vs finished design, hold to compare, play shot), three steps, FAQ.
Headless Chrome checks: `audit.mjs` 188/188 (old hero/samples tests retired), `audit3.mjs` 36 checks for the new home (layout at 4 widths, pins seek the film, camera marker moves, share link round trip, compare toggle/hold/play, FAQ, internal links, reduced motion). The scripts live in the session scratchpad, not the repo.
